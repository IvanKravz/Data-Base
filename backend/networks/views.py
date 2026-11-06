import ipaddress

from django.db import transaction
from django.db.models import Count
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from facilities.models import Division, Facility
from users.logging.networks import (
    log_network_bulk_create,
    log_network_bulk_delete,
    log_network_create,
    log_network_delete,
    log_network_update,
    log_network_view,
)
from users.mixins import RoleBasedFilterMixin

from .models import (
    ACL,
    CommunicationNetwork,
    IPAddress,
    NetworkDirection,
    NetworkInterface,
    NetworkMembership,
    NetworkNodePosition,
    RoutingTable,
    Subnet,
    VLAN,
    VLANConfiguration,
)
from .serializers import (
    ACLSerializer,
    CommunicationNetworkSerializer,
    ExplicitDivisionSerializer,
    ExplicitFacilitySerializer,
    IPAddressSerializer,
    NetworkDirectionBulkCreateSerializer,
    NetworkDirectionSerializer,
    NetworkInterfaceSerializer,
    NetworkMembershipSerializer,
    NetworkNodePositionSerializer,
    RoutingTableSerializer,
    SubnetSerializer,
    VLANConfigurationSerializer,
    VLANSerializer,
)


# ============================================================================
# Сеть связи
# ============================================================================

class CommunicationNetworkViewSet(RoleBasedFilterMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = CommunicationNetwork.objects.all().prefetch_related(
        'memberships__division',
        'memberships__facility',
        'memberships__equipment',
    )
    serializer_class = CommunicationNetworkSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'network_class': ['exact'],
        'security_level': ['exact'],
        'protocol': ['exact'],
        'ip_range': ['icontains'],
        'throughput': ['gte', 'lte'],
    }
    search_fields = ['name', 'description', 'ip_range']
    ordering_fields = ['name', 'network_class', 'security_level', 'throughput']
    ordering = ['name']

    def _get_changed_fields(self, old_data, new_data):
        changed = {}
        for key in old_data:
            if key in new_data and old_data[key] != new_data[key]:
                changed[key] = {'old': old_data[key], 'new': new_data[key]}
        return changed

    def get_queryset(self):
        queryset = super().get_queryset()
        if self._can_see_all_divisions():
            division_id = self.request.query_params.get('division')
            if division_id:
                queryset = queryset.filter(memberships__division_id=division_id)
        return queryset.distinct()

    @action(detail=True, methods=['get'])
    def get_network(self, request, pk=None):
        network = self.get_object()
        serializer = self.get_serializer(network)
        log_network_view(request.user, network, request=request)
        return Response(serializer.data)

    # ------------------------------------------------------------------ #
    # Единый эндпоинт схемы: network + memberships + directions +
    # positions + счётчики + явно добавленные пустые контейнеры.
    # ------------------------------------------------------------------ #
    @action(detail=True, methods=['get'], url_path='schema')
    def schema(self, request, pk=None):
        network = self.get_object()

        memberships = network.memberships.select_related(
            'division', 'facility', 'equipment', 'equipment__category',
        ).all()

        equipment_ids = [m.equipment_id for m in memberships if m.equipment_id]

        iface_counts: dict = {}
        ip_counts: dict = {}
        if equipment_ids:
            iface_counts = dict(
                NetworkInterface.objects
                .filter(equipment_id__in=equipment_ids)
                .values('equipment_id')
                .annotate(c=Count('id'))
                .values_list('equipment_id', 'c')
            )
            ip_counts = dict(
                IPAddress.objects
                .filter(interface__equipment_id__in=equipment_ids)
                .values('interface__equipment_id')
                .annotate(c=Count('id'))
                .values_list('interface__equipment_id', 'c')
            )

        directions = network.directions.select_related(
            'from_membership__equipment', 'to_membership__equipment',
            'from_interface', 'to_interface',
        ).all()
        positions = network.node_positions.all()

        # ===== NEW: явно добавленные пустые контейнеры =====
        division_ids_with_membership = {
            m.division_id for m in memberships if m.division_id
        }
        facility_ids_with_membership = {
            m.facility_id for m in memberships if m.facility_id
        }

        explicit_division_ids = [
            p.node_id for p in positions
            if p.node_type == 'division'
            and p.is_explicit
            and p.node_id not in division_ids_with_membership
        ]
        explicit_facility_ids = [
            p.node_id for p in positions
            if p.node_type == 'facility'
            and p.is_explicit
            and p.node_id not in facility_ids_with_membership
        ]

        explicit_divisions = Division.objects.filter(id__in=explicit_division_ids)
        explicit_facilities = Facility.objects.filter(id__in=explicit_facility_ids)

        log_network_view(request.user, network, request=request)

        return Response({
            'network': self.get_serializer(network).data,
            'memberships': NetworkMembershipSerializer(memberships, many=True).data,
            'directions': NetworkDirectionSerializer(directions, many=True).data,
            'positions': NetworkNodePositionSerializer(positions, many=True).data,
            'counts': {
                'interfaces': {str(k): v for k, v in iface_counts.items()},
                'ip_addresses': {str(k): v for k, v in ip_counts.items()},
            },
            'explicit_divisions': ExplicitDivisionSerializer(
                explicit_divisions, many=True,
            ).data,
            'explicit_facilities': ExplicitFacilitySerializer(
                explicit_facilities, many=True,
            ).data,
        })

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            instance = self.get_queryset().get(id=response.data['id'])
            log_network_create(
                user=request.user, instance=instance,
                request=request, details={'data': response.data},
            )
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = self.get_serializer(instance).data
        response = super().update(request, *args, **kwargs)
        if response.status_code in (status.HTTP_200_OK, status.HTTP_201_CREATED):
            log_network_update(
                user=request.user, instance=instance, request=request,
                old_data=old_data,
                details={
                    'changed_fields': self._get_changed_fields(old_data, response.data),
                },
            )
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        net_data = self.get_serializer(instance).data
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == status.HTTP_204_NO_CONTENT:
            log_network_delete(
                user=request.user, instance=instance,
                request=request, details={'deleted_data': net_data},
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_network_view(user=request.user, instance=instance, request=request)
        return response


# ============================================================================
# Принадлежность сети
# ============================================================================

class NetworkMembershipViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = NetworkMembership.objects.all()
    serializer_class = NetworkMembershipSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['network']

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        network_id = request.data.get('network')
        memberships = request.data.get('memberships', [])

        with transaction.atomic():
            old_memberships = NetworkMembership.objects.filter(network_id=network_id)
            if old_memberships.exists():
                log_network_bulk_delete(
                    user=request.user, queryset=old_memberships,
                    network_id=network_id, request=request,
                    details={'action': 'bulk_delete_before_create'},
                )
                old_memberships.delete()

            created = []
            for m in memberships:
                payload = {**m}
                if 'division' in payload:
                    payload['division_id'] = payload.pop('division')
                if 'facility' in payload:
                    payload['facility_id'] = payload.pop('facility')
                if 'equipment' in payload:
                    payload['equipment_id'] = payload.pop('equipment')
                payload['network'] = network_id

                ser = self.get_serializer(data=payload)
                if not ser.is_valid():
                    raise serializers.ValidationError(ser.errors)
                created.append(ser.save())

        if created:
            log_network_bulk_create(
                user=request.user, instances=created,
                network_id=network_id, request=request,
                details={'count': len(created)},
            )

        return Response(
            NetworkMembershipSerializer(created, many=True).data,
            status=status.HTTP_201_CREATED,
        )


# ============================================================================
# Направления
# ============================================================================

class NetworkDirectionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = NetworkDirection.objects.select_related(
        'from_membership__division',
        'from_membership__facility',
        'from_membership__equipment',
        'to_membership__division',
        'to_membership__facility',
        'to_membership__equipment',
        'from_interface', 'to_interface',
    )
    serializer_class = NetworkDirectionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['network', 'from_interface', 'to_interface']
    ordering = ['id']

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        serializer = NetworkDirectionBulkCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        directions = serializer.save()
        log_network_bulk_create(
            user=request.user, instances=directions,
            network_id=request.data.get('network'), request=request,
            details={'directions_count': len(directions)},
        )
        return Response(
            NetworkDirectionSerializer(directions, many=True).data,
            status=status.HTTP_201_CREATED,
        )


# ============================================================================
# Позиции узлов на схеме (drag-and-drop + явные контейнеры)
# ============================================================================

class NetworkNodePositionViewSet(viewsets.ViewSet):
    """
    Позиции узлов схемы для конкретной сети. Работает как вложенный ресурс:
    /networks/<network_pk>/node-positions/

    Эндпоинты:
      GET   list          — все сохранённые позиции сети
      POST  bulk_upsert   — батч-сохранение (после drag-and-drop или
                            при добавлении явного контейнера)
      POST  delete        — удалить одну позицию (для очистки sentinel'ов
                            после появления членства)
      POST  reset         — удалить все позиции (вернуться к авто-лейауту)
    """
    permission_classes = [IsAuthenticated]

    def list(self, request, network_pk=None):
        qs = NetworkNodePosition.objects.filter(network_id=network_pk)
        return Response(NetworkNodePositionSerializer(qs, many=True).data)

    def bulk_upsert(self, request, network_pk=None):
        if not CommunicationNetwork.objects.filter(pk=network_pk).exists():
            return Response(
                {'detail': 'Сеть не найдена'},
                status=status.HTTP_404_NOT_FOUND,
            )

        items = request.data.get('positions') or []
        if not isinstance(items, list):
            return Response(
                {'detail': 'positions должен быть списком'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_types = {t[0] for t in NetworkNodePosition.NODE_TYPES}

        saved = []
        with transaction.atomic():
            for item in items:
                node_type = item.get('node_type')
                node_id = item.get('node_id')
                x = item.get('x')
                y = item.get('y')

                if node_type not in valid_types:
                    continue
                if node_id is None or x is None or y is None:
                    continue

                try:
                    node_id_int = int(node_id)
                    x_float = float(x)
                    y_float = float(y)
                except (TypeError, ValueError):
                    continue

                defaults = {'x': x_float, 'y': y_float}
                # ✅ is_explicit не перезаписываем, если он не пришёл
                if 'is_explicit' in item:
                    defaults['is_explicit'] = bool(item['is_explicit'])

                obj, _ = NetworkNodePosition.objects.update_or_create(
                    network_id=network_pk,
                    node_type=node_type,
                    node_id=node_id_int,
                    defaults=defaults,
                )
                saved.append(obj)

        return Response(NetworkNodePositionSerializer(saved, many=True).data)

    @action(detail=False, methods=['post'], url_path='delete')
    def delete_position(self, request, network_pk=None):
        """
        Удаляет одну позицию. Нужно, чтобы снять sentinel-маркер
        с пустого контейнера, когда в нём появилась техника
        (дальше auto-layout сам поставит его в правильное место).
        """
        node_type = request.data.get('node_type')
        node_id = request.data.get('node_id')

        if node_type not in {t[0] for t in NetworkNodePosition.NODE_TYPES}:
            return Response(
                {'detail': 'Неверный node_type'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            node_id_int = int(node_id)
        except (TypeError, ValueError):
            return Response(
                {'detail': 'node_id должен быть числом'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        NetworkNodePosition.objects.filter(
            network_id=network_pk,
            node_type=node_type,
            node_id=node_id_int,
        ).delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    def reset(self, request, network_pk=None):
        NetworkNodePosition.objects.filter(network_id=network_pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============================================================================
# VLAN
# ============================================================================

class VLANViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = VLAN.objects.all()
    serializer_class = VLANSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['vlan_id']
    search_fields = ['name', 'description']
    ordering_fields = ['vlan_id', 'name']
    ordering = ['vlan_id']


# ============================================================================
# Сетевой интерфейс
# ============================================================================

class NetworkInterfaceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = NetworkInterface.objects.select_related(
        'equipment', 'access_vlan', 'native_vlan', 'connected_to',
    )
    serializer_class = NetworkInterfaceSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'equipment', 'interface_type', 'enabled', 'access_vlan', 'native_vlan',
        'mode',
    ]
    search_fields = ['name', 'mac_address']
    ordering_fields = ['name', 'equipment']
    ordering = ['equipment', 'name']


# ============================================================================
# Подсети
# ============================================================================

class SubnetViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Subnet.objects.select_related('network', 'vlan', 'parent')
    serializer_class = SubnetSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['network', 'vlan', 'parent']
    search_fields = ['network_address', 'purpose', 'description']
    ordering_fields = ['network_address', 'prefix_length', 'created_at']
    ordering = ['network', 'network_address', 'prefix_length']

    # ---------- split ----------
    @action(detail=True, methods=['post'])
    def split(self, request, pk=None):
        """
        POST /networks/subnets/{id}/split/
        body: { "child_prefix": 25 }
        """
        subnet = self.get_object()

        try:
            child_prefix = int(request.data.get('child_prefix'))
        except (TypeError, ValueError):
            return Response(
                {'child_prefix': 'Обязательное целое число'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not (subnet.prefix_length < child_prefix <= Subnet.PREFIX_MAX):
            return Response(
                {'child_prefix': (
                    f'Должен быть больше {subnet.prefix_length} '
                    f'и не больше {Subnet.PREFIX_MAX}'
                )},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if subnet.children.exists():
            return Response(
                {'detail': 'У подсети уже есть дочерние. Удалите их сначала.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if subnet.ip_addresses.exists():
            return Response(
                {'detail': 'Удалите IP-адреса из подсети перед разбивкой '
                           '(или перенесите их в дочерние)'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            children_nets = list(subnet.ip_network.subnets(new_prefix=child_prefix))
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        try:
            with transaction.atomic():
                for child_net in children_nets:
                    child = Subnet(
                        network=subnet.network,
                        parent=subnet,
                        vlan=subnet.vlan,
                        network_address=str(child_net.network_address),
                        prefix_length=child_prefix,
                        purpose=subnet.purpose,
                    )
                    child.full_clean()
                    child.save()
                    created.append(child)
        except Exception as e:
            return Response(
                {'detail': f'Ошибка создания дочерних подсетей: {e}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        log_network_create(
            user=request.user, instance=subnet, request=request,
            details={
                'action': 'split',
                'child_prefix': child_prefix,
                'created': [c.cidr for c in created],
            },
        )
        return Response(
            SubnetSerializer(created, many=True).data,
            status=status.HTTP_201_CREATED,
        )

    # ---------- список хостов (с фильтрами) ----------
    @action(detail=True, methods=['get'])
    def hosts(self, request, pk=None):
        """
        GET /networks/subnets/{id}/hosts/
          ?search=<str>   — поиск по адресу/hostname/purpose/assigned_to/...
          ?status=<str>   — free|reserved|in_use|deprecated
          ?limit=<int>    — обрезать результат (по умолчанию без лимита)
          ?offset=<int>   — сдвиг
        Без фильтров возвращает все адреса (обратная совместимость).
        """
        subnet = self.get_object()
        net = subnet.ip_network

        search = (request.query_params.get('search') or '').strip().lower()
        status_filter = request.query_params.get('status')
        try:
            limit = min(int(request.query_params.get('limit', 0)) or 0, 2000)
            offset = max(int(request.query_params.get('offset', 0)), 0)
        except (TypeError, ValueError):
            limit, offset = 0, 0

        used = {
            ip.address: ip
            for ip in subnet.ip_addresses.select_related('interface__equipment')
        }

        result = []
        for host in net.hosts():
            addr = str(host)
            ip_obj = used.get(addr)

            if ip_obj is None:
                if status_filter and status_filter != 'free':
                    continue
                row = {
                    'address': addr,
                    'ip_id': None,
                    'status': 'free',
                    'hostname': '',
                    'purpose': '',
                    'assigned_to': '',
                    'description': '',
                    'is_primary': False,
                    'interface_id': None,
                    'interface_name': None,
                    'equipment_name': None,
                }
            else:
                if status_filter and status_filter != ip_obj.status:
                    continue
                row = {
                    'address': addr,
                    'ip_id': ip_obj.id,
                    'status': ip_obj.status,
                    'hostname': ip_obj.hostname,
                    'purpose': ip_obj.purpose,
                    'assigned_to': ip_obj.assigned_to,
                    'description': ip_obj.description,
                    'is_primary': ip_obj.is_primary,
                    'interface_id': ip_obj.interface_id,
                    'interface_name': (
                        ip_obj.interface.name if ip_obj.interface else None
                    ),
                    'equipment_name': (
                        ip_obj.interface.equipment.name
                        if ip_obj.interface and ip_obj.interface.equipment_id
                        else None
                    ),
                }

            if search:
                haystack = ' '.join(str(v or '') for v in row.values()).lower()
                if search not in haystack:
                    continue

            result.append(row)

        if limit or offset:
            result = result[offset:offset + limit] if limit else result[offset:]

        return Response(result)

    # ---------- bulk save ----------
    @action(detail=True, methods=['post'], url_path='hosts/bulk')
    def hosts_bulk(self, request, pk=None):
        subnet = self.get_object()
        items = request.data.get('hosts') or []
        if not isinstance(items, list):
            return Response(
                {'detail': 'hosts должен быть списком'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        net = subnet.ip_network
        existing = {ip.address: ip for ip in subnet.ip_addresses.all()}

        results = []
        errors = []

        try:
            with transaction.atomic():
                for idx, item in enumerate(items):
                    addr = (item.get('address') or '').strip()
                    if not addr:
                        continue
                    try:
                        ipaddress.IPv4Address(addr)
                    except ValueError:
                        errors.append(
                            {'index': idx, 'address': 'некорректный IPv4'}
                        )
                        continue
                    if ipaddress.IPv4Address(addr) not in net:
                        errors.append({'index': idx, 'address': 'вне подсети'})
                        continue

                    status_val = item.get('status', 'free')
                    ip_obj = existing.get(addr)

                    if status_val == 'free':
                        if ip_obj:
                            ip_obj.delete()
                        results.append({'address': addr, 'status': 'free'})
                        continue

                    payload = {
                        'subnet': subnet.id,
                        'address': addr,
                        'status': status_val,
                        'hostname': item.get('hostname', ''),
                        'purpose': item.get('purpose', ''),
                        'assigned_to': item.get('assigned_to', ''),
                        'is_primary': bool(item.get('is_primary', False)),
                        'description': item.get('description', ''),
                        'interface': item.get('interface_id') or None,
                    }

                    if ip_obj:
                        ser = IPAddressSerializer(ip_obj, data=payload, partial=True)
                    else:
                        ser = IPAddressSerializer(data=payload)

                    if ser.is_valid():
                        obj = ser.save()
                        results.append(IPAddressSerializer(obj).data)
                    else:
                        errors.append({'index': idx, 'errors': ser.errors})

                if errors:
                    raise ValueError('validation_failed')
        except ValueError:
            return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

        log_network_update(
            user=request.user, instance=subnet, request=request,
            old_data=None,
            details={'action': 'hosts_bulk', 'count': len(results)},
        )
        return Response({'saved': results}, status=status.HTTP_200_OK)

    # ---------- поиск свободных подсетей ----------
    @action(detail=False, methods=['get'], url_path='available')
    def available(self, request):
        """
        GET /networks/subnets/available/?network=X&prefix=24&limit=10
        """
        network_id = request.query_params.get('network')
        if not network_id:
            return Response(
                {'detail': 'Параметр network обязателен'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            prefix = int(request.query_params.get('prefix', 24))
            limit = min(int(request.query_params.get('limit', 10)), 50)
        except (ValueError, TypeError):
            return Response(
                {'detail': 'Некорректные prefix/limit'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not (8 <= prefix <= 31):
            return Response(
                {'detail': 'prefix должен быть в диапазоне 8..31'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            network = CommunicationNetwork.objects.get(pk=network_id)
        except CommunicationNetwork.DoesNotExist:
            return Response(
                {'detail': 'Сеть не найдена'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not network.ip_range:
            return Response({
                'results': [],
                'hint': 'no_ip_range',
                'detail': 'У сети не задан IP-диапазон — введите адрес вручную',
            })

        try:
            parent = ipaddress.IPv4Network(network.ip_range, strict=False)
        except (ValueError, TypeError):
            return Response({
                'results': [],
                'hint': 'invalid_ip_range',
                'detail': f'Некорректный ip_range у сети: {network.ip_range}',
            })

        if parent.prefixlen > prefix:
            return Response({
                'results': [],
                'hint': 'parent_too_small',
                'detail': (
                    f'IP-диапазон сети ({parent}) меньше '
                    f'запрошенного /{prefix}'
                ),
            })

        occupied_nets = []
        for addr, plen in Subnet.objects.values_list('network_address', 'prefix_length'):
            try:
                occupied_nets.append(
                    ipaddress.IPv4Network(f'{addr}/{plen}', strict=False)
                )
            except ValueError:
                continue

        results = []
        try:
            candidates = parent.subnets(new_prefix=prefix)
        except ValueError:
            return Response({
                'results': [],
                'detail': 'Ошибка разбиения родительского диапазона',
            }, status=status.HTTP_400_BAD_REQUEST)

        for candidate in candidates:
            if len(results) >= limit:
                break
            if any(candidate.overlaps(o) for o in occupied_nets):
                continue
            results.append({
                'network_address': str(candidate.network_address),
                'prefix_length': prefix,
                'cidr': str(candidate),
                'parent_cidr': str(parent),
            })

        return Response({
            'results': results,
            'parent_cidr': str(parent),
            'requested_prefix': prefix,
        })


# ============================================================================
# IP-адреса
# ============================================================================

class IPAddressViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = IPAddress.objects.select_related(
        'subnet', 'interface', 'interface__equipment',
    )
    serializer_class = IPAddressSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'subnet', 'status', 'interface', 'is_primary',
        'interface__equipment',
        'subnet__network',
    ]
    search_fields = ['address', 'hostname', 'purpose', 'assigned_to']
    ordering = ['address']


# ============================================================================
# VLAN-конфигурация, маршруты, ACL
# ============================================================================

class VLANConfigurationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = VLANConfiguration.objects.select_related('interface', 'vlan')
    serializer_class = VLANConfigurationSerializer


class RoutingTableViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = RoutingTable.objects.select_related('equipment', 'interface')
    serializer_class = RoutingTableSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['equipment']


class ACLViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = ACL.objects.select_related('equipment')
    serializer_class = ACLSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['equipment']