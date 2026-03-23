from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import CommunicationNetwork, VLAN, NetworkDirection, NetworkInterface, IPAddress, IPRange, NetworkMembership, VLANConfiguration, RoutingTable, ACL
from users.mixins import RoleBasedFilterMixin
from .serializers import (
    CommunicationNetworkSerializer,
    NetworkDirectionBulkCreateSerializer,
    NetworkDirectionSerializer,
    NetworkMembershipSerializer, 
    VLANSerializer, 
    NetworkInterfaceSerializer, 
    IPAddressSerializer, 
    IPRangeSerializer,
    VLANConfigurationSerializer,
    RoutingTableSerializer,
    ACLSerializer
)
from users.logging.networks import (
    log_network_create, log_network_update, log_network_delete, log_network_view,
    log_network_bulk_create, log_network_bulk_delete
)


class CommunicationNetworkViewSet(RoleBasedFilterMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = CommunicationNetwork.objects.all().prefetch_related(
        'memberships__division',
        'memberships__facility',
        'memberships__equipment'
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

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            instance = self.get_queryset().get(id=response.data['id'])
            log_network_create(
                user=request.user,
                instance=instance,
                request=request,
                details={'data': response.data}
            )
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = self.get_serializer(instance).data
        response = super().update(request, *args, **kwargs)
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            log_network_update(
                user=request.user,
                instance=instance,
                request=request,
                old_data=old_data,
                details={'changed_fields': self._get_changed_fields(old_data, response.data)}
            )
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        net_data = self.get_serializer(instance).data
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == status.HTTP_204_NO_CONTENT:
            log_network_delete(
                user=request.user,
                instance=instance,
                request=request,
                details={'deleted_data': net_data}
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_network_view(
            user=request.user,
            instance=instance,
            request=request
        )
        return response


class NetworkMembershipViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = NetworkMembership.objects.all()
    serializer_class = NetworkMembershipSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['network']

    def _get_changed_fields(self, old_data, new_data):
        changed = {}
        for key in old_data:
            if key in new_data and old_data[key] != new_data[key]:
                changed[key] = {'old': old_data[key], 'new': new_data[key]}
        return changed

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        network_id = request.data.get('network')
        memberships = request.data.get('memberships', [])

        # Логируем удаление старых связей, если они были
        old_memberships = NetworkMembership.objects.filter(network_id=network_id)
        if old_memberships.exists():
            log_network_bulk_delete(
                user=request.user,
                queryset=old_memberships,
                network_id=network_id,
                request=request,
                details={'action': 'bulk_delete_before_create'}
            )
            old_memberships.delete()

        # Создаем новые связи
        created = []
        for membership in memberships:
            if 'division' in membership:
                membership['division_id'] = membership.pop('division')
            if 'facility' in membership:
                membership['facility_id'] = membership.pop('facility')
            if 'equipment' in membership:
                membership['equipment_id'] = membership.pop('equipment')

            membership_data = {
                **membership,
                'network': network_id
            }

            serializer = self.get_serializer(data=membership_data)
            if serializer.is_valid():
                obj = serializer.save()
                created.append(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if created:
            # Для получения экземпляров для логирования можно использовать created объекты, но проще:
            instances = NetworkMembership.objects.filter(id__in=[item['id'] for item in created if 'id' in item])
            log_network_bulk_create(
                user=request.user,
                instances=instances,
                network_id=network_id,
                request=request,
                details={'count': len(created)}
            )

        return Response(created, status=status.HTTP_201_CREATED)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            instance = self.get_queryset().get(id=response.data['id'])
            log_network_create(
                user=request.user,
                instance=instance,
                request=request,
                details={'data': response.data}
            )
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = self.get_serializer(instance).data
        response = super().update(request, *args, **kwargs)
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            log_network_update(
                user=request.user,
                instance=instance,
                request=request,
                old_data=old_data,
                details={'changed_fields': self._get_changed_fields(old_data, response.data)}
            )
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        membership_data = self.get_serializer(instance).data
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == status.HTTP_204_NO_CONTENT:
            log_network_delete(
                user=request.user,
                instance=instance,
                request=request,
                details={'deleted_data': membership_data}
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_network_view(
            user=request.user,
            instance=instance,
            request=request
        )
        return response


class NetworkDirectionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = NetworkDirection.objects.select_related(
        'from_membership__division',
        'from_membership__facility',
        'from_membership__equipment',
        'to_membership__division',
        'to_membership__facility',
        'to_membership__equipment'
    )
    serializer_class = NetworkDirectionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['network']

    def _get_changed_fields(self, old_data, new_data):
        changed = {}
        for key in old_data:
            if key in new_data and old_data[key] != new_data[key]:
                changed[key] = {'old': old_data[key], 'new': new_data[key]}
        return changed

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        serializer = NetworkDirectionBulkCreateSerializer(data=request.data)
        if serializer.is_valid():
            directions = serializer.save()
            log_network_bulk_create(
                user=request.user,
                instances=directions,
                network_id=request.data.get('network'),
                request=request,
                details={'directions_count': len(directions)}
            )
            return Response(
                NetworkDirectionSerializer(directions, many=True).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            instance = self.get_queryset().get(id=response.data['id'])
            log_network_create(
                user=request.user,
                instance=instance,
                request=request,
                details={'data': response.data}
            )
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = self.get_serializer(instance).data
        response = super().update(request, *args, **kwargs)
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            log_network_update(
                user=request.user,
                instance=instance,
                request=request,
                old_data=old_data,
                details={'changed_fields': self._get_changed_fields(old_data, response.data)}
            )
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        direction_data = self.get_serializer(instance).data
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == status.HTTP_204_NO_CONTENT:
            log_network_delete(
                user=request.user,
                instance=instance,
                request=request,
                details={'deleted_data': direction_data}
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_network_view(
            user=request.user,
            instance=instance,
            request=request
        )
        return response


class VLANViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = VLAN.objects.all()
    serializer_class = VLANSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['vlan_id']
    search_fields = ['name', 'description']
    ordering_fields = ['vlan_id', 'name']
    ordering = ['vlan_id']

    def _get_changed_fields(self, old_data, new_data):
        changed = {}
        for key in old_data:
            if key in new_data and old_data[key] != new_data[key]:
                changed[key] = {'old': old_data[key], 'new': new_data[key]}
        return changed

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            instance = self.get_queryset().get(id=response.data['id'])
            log_network_create(
                user=request.user,
                instance=instance,
                request=request,
                details={'data': response.data}
            )
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = self.get_serializer(instance).data
        response = super().update(request, *args, **kwargs)
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            log_network_update(
                user=request.user,
                instance=instance,
                request=request,
                old_data=old_data,
                details={'changed_fields': self._get_changed_fields(old_data, response.data)}
            )
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        vlan_data = self.get_serializer(instance).data
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == status.HTTP_204_NO_CONTENT:
            log_network_delete(
                user=request.user,
                instance=instance,
                request=request,
                details={'deleted_data': vlan_data}
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_network_view(
            user=request.user,
            instance=instance,
            request=request
        )
        return response


class NetworkInterfaceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = NetworkInterface.objects.select_related('equipment', 'access_vlan', 'native_vlan')
    serializer_class = NetworkInterfaceSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['equipment', 'interface_type', 'enabled', 'access_vlan', 'native_vlan']
    search_fields = ['name', 'mac_address']
    ordering_fields = ['name', 'equipment']
    ordering = ['equipment', 'name']

    def _get_changed_fields(self, old_data, new_data):
        changed = {}
        for key in old_data:
            if key in new_data and old_data[key] != new_data[key]:
                changed[key] = {'old': old_data[key], 'new': new_data[key]}
        return changed

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            instance = self.get_queryset().get(id=response.data['id'])
            log_network_create(
                user=request.user,
                instance=instance,
                request=request,
                details={'data': response.data}
            )
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = self.get_serializer(instance).data
        response = super().update(request, *args, **kwargs)
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            log_network_update(
                user=request.user,
                instance=instance,
                request=request,
                old_data=old_data,
                details={'changed_fields': self._get_changed_fields(old_data, response.data)}
            )
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        interface_data = self.get_serializer(instance).data
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == status.HTTP_204_NO_CONTENT:
            log_network_delete(
                user=request.user,
                instance=instance,
                request=request,
                details={'deleted_data': interface_data}
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_network_view(
            user=request.user,
            instance=instance,
            request=request
        )
        return response


class IPAddressViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = IPAddress.objects.select_related('interface', 'interface__equipment')
    serializer_class = IPAddressSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['interface', 'version', 'is_primary']
    search_fields = ['address', 'gateway']
    ordering_fields = ['address', 'interface']
    ordering = ['interface', 'address']

    def _get_changed_fields(self, old_data, new_data):
        changed = {}
        for key in old_data:
            if key in new_data and old_data[key] != new_data[key]:
                changed[key] = {'old': old_data[key], 'new': new_data[key]}
        return changed

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            instance = self.get_queryset().get(id=response.data['id'])
            log_network_create(
                user=request.user,
                instance=instance,
                request=request,
                details={'data': response.data}
            )
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = self.get_serializer(instance).data
        response = super().update(request, *args, **kwargs)
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            log_network_update(
                user=request.user,
                instance=instance,
                request=request,
                old_data=old_data,
                details={'changed_fields': self._get_changed_fields(old_data, response.data)}
            )
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        ip_data = self.get_serializer(instance).data
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == status.HTTP_204_NO_CONTENT:
            log_network_delete(
                user=request.user,
                instance=instance,
                request=request,
                details={'deleted_data': ip_data}
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_network_view(
            user=request.user,
            instance=instance,
            request=request
        )
        return response


class IPRangeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = IPRange.objects.prefetch_related('devices', 'vlan')
    serializer_class = IPRangeSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['vlan']
    search_fields = ['network', 'description']
    ordering_fields = ['network', 'created_at']
    ordering = ['network']

    def _get_changed_fields(self, old_data, new_data):
        changed = {}
        for key in old_data:
            if key in new_data and old_data[key] != new_data[key]:
                changed[key] = {'old': old_data[key], 'new': new_data[key]}
        return changed

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            instance = self.get_queryset().get(id=response.data['id'])
            log_network_create(
                user=request.user,
                instance=instance,
                request=request,
                details={'data': response.data}
            )
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = self.get_serializer(instance).data
        response = super().update(request, *args, **kwargs)
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            log_network_update(
                user=request.user,
                instance=instance,
                request=request,
                old_data=old_data,
                details={'changed_fields': self._get_changed_fields(old_data, response.data)}
            )
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        range_data = self.get_serializer(instance).data
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == status.HTTP_204_NO_CONTENT:
            log_network_delete(
                user=request.user,
                instance=instance,
                request=request,
                details={'deleted_data': range_data}
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_network_view(
            user=request.user,
            instance=instance,
            request=request
        )
        return response


class VLANConfigurationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = VLANConfiguration.objects.select_related('interface', 'vlan')
    serializer_class = VLANConfigurationSerializer

    def _get_changed_fields(self, old_data, new_data):
        changed = {}
        for key in old_data:
            if key in new_data and old_data[key] != new_data[key]:
                changed[key] = {'old': old_data[key], 'new': new_data[key]}
        return changed

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            instance = self.get_queryset().get(id=response.data['id'])
            log_network_create(
                user=request.user,
                instance=instance,
                request=request,
                details={'data': response.data}
            )
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = self.get_serializer(instance).data
        response = super().update(request, *args, **kwargs)
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            log_network_update(
                user=request.user,
                instance=instance,
                request=request,
                old_data=old_data,
                details={'changed_fields': self._get_changed_fields(old_data, response.data)}
            )
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        config_data = self.get_serializer(instance).data
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == status.HTTP_204_NO_CONTENT:
            log_network_delete(
                user=request.user,
                instance=instance,
                request=request,
                details={'deleted_data': config_data}
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_network_view(
            user=request.user,
            instance=instance,
            request=request
        )
        return response


class RoutingTableViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = RoutingTable.objects.select_related('equipment', 'interface')
    serializer_class = RoutingTableSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['equipment']

    def _get_changed_fields(self, old_data, new_data):
        changed = {}
        for key in old_data:
            if key in new_data and old_data[key] != new_data[key]:
                changed[key] = {'old': old_data[key], 'new': new_data[key]}
        return changed

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            instance = self.get_queryset().get(id=response.data['id'])
            log_network_create(
                user=request.user,
                instance=instance,
                request=request,
                details={'data': response.data}
            )
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = self.get_serializer(instance).data
        response = super().update(request, *args, **kwargs)
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            log_network_update(
                user=request.user,
                instance=instance,
                request=request,
                old_data=old_data,
                details={'changed_fields': self._get_changed_fields(old_data, response.data)}
            )
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        route_data = self.get_serializer(instance).data
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == status.HTTP_204_NO_CONTENT:
            log_network_delete(
                user=request.user,
                instance=instance,
                request=request,
                details={'deleted_data': route_data}
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_network_view(
            user=request.user,
            instance=instance,
            request=request
        )
        return response


class ACLViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = ACL.objects.select_related('equipment')
    serializer_class = ACLSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['equipment']

    def _get_changed_fields(self, old_data, new_data):
        changed = {}
        for key in old_data:
            if key in new_data and old_data[key] != new_data[key]:
                changed[key] = {'old': old_data[key], 'new': new_data[key]}
        return changed

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            instance = self.get_queryset().get(id=response.data['id'])
            log_network_create(
                user=request.user,
                instance=instance,
                request=request,
                details={'data': response.data}
            )
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = self.get_serializer(instance).data
        response = super().update(request, *args, **kwargs)
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            log_network_update(
                user=request.user,
                instance=instance,
                request=request,
                old_data=old_data,
                details={'changed_fields': self._get_changed_fields(old_data, response.data)}
            )
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        acl_data = self.get_serializer(instance).data
        response = super().destroy(request, *args, **kwargs)
        if response.status_code == status.HTTP_204_NO_CONTENT:
            log_network_delete(
                user=request.user,
                instance=instance,
                request=request,
                details={'deleted_data': acl_data}
            )
        return response

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        response = super().retrieve(request, *args, **kwargs)
        log_network_view(
            user=request.user,
            instance=instance,
            request=request
        )
        return response