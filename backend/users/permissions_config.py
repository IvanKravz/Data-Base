"""
Конфигурация системы прав доступа для различных ролей
"""

ROLE_PERMISSIONS = {
    'admin': {
        'name': 'Администратор',
        'models': {
            'Employee': ['view', 'add', 'change', 'delete'],
            'ShaWorkerDetails': ['view', 'add', 'change', 'delete'],
            'ShaEquipmentConclusion': ['view', 'add', 'change', 'delete'],
            'User': ['view', 'add', 'change', 'delete'],
            'Division': ['view', 'add', 'change', 'delete'],
            'Subdivision': ['view', 'add', 'change', 'delete'],
            'Equipment': ['view', 'add', 'change', 'delete'],
            'Facility': ['view', 'add', 'change', 'delete'],
            'CommunicationNetwork': ['view', 'add', 'change', 'delete'],
            'Task': ['view', 'add', 'change', 'delete'],
            'CommunicationPost': ['view', 'add', 'change', 'delete'],
            'FacilityType': ['view', 'add', 'change', 'delete'],
            'EquipmentCategory': ['view', 'add', 'change', 'delete'],
            'StorageFolder': ['view', 'add', 'change', 'delete'],
            'StorageFile': ['view', 'add', 'change', 'delete'],
        },
        'filters': {},
        'can_see_all_divisions': True,
        'can_access_storage': True,
        'can_see_all_storage': True,
        'storage_quota': None,
        'max_file_size': 1024 * 1024 * 1024,  # 1GB
        'description': 'Полный доступ ко всем функциям системы'
    },
    
    'leader': {
        'name': 'Руководитель',
        'models': {
            'Employee': ['view'],
            'ShaWorkerDetails': ['view'],
            'ShaEquipmentConclusion': ['view'],
            'User': ['view'],
            'Division': ['view'],
            'Subdivision': ['view'],
            'Equipment': ['view'],
            'Facility': ['view'],
            'CommunicationNetwork': ['view'],
            'Task': ['view'],
            'CommunicationPost': ['view'],
            'FacilityType': ['view'],
            'EquipmentCategory': ['view'],
            'StorageFolder': ['view', 'add', 'change', 'delete'],
            'StorageFile': ['view', 'add', 'change', 'delete'],
        },
        'filters': {},
        'can_see_all_divisions': True,
        'can_access_storage': True,
        'can_see_all_storage': True,
        'storage_quota': 10 * 1024 * 1024 * 1024,  # 10GB
        'max_file_size': 100 * 1024 * 1024,        # 100MB
        'description': 'Просмотр всей информации без возможности изменений'
    },

    'deputy_director': {
        'name': 'Заместитель руководителя',
        'models': {
            'Employee': ['view'],
            'Equipment': ['view'],
            'Facility': ['view'],
            'CommunicationNetwork': ['view'],
            'Task': ['view'],
            'Division': ['view'],
            'Subdivision': ['view'],
            'CommunicationPost': ['view'],
            'FacilityType': ['view'],
            'EquipmentCategory': ['view'],
            'StorageFolder': ['view', 'add', 'change', 'delete'],
            'StorageFile': ['view', 'add', 'change', 'delete'],
        },
        'filters': {},
        'can_see_all_divisions': True,
        'can_access_storage': True,
        'can_see_all_storage': False,
        'storage_quota': 5 * 1024 * 1024 * 1024,  # 5GB
        'max_file_size': 50 * 1024 * 1024,        # 50MB
        'description': 'Просмотр всех данных системы'
    },
    
    'head_of_department_1': {
        'name': 'Начальник 1 отдела',
        'models': {
            'Employee': ['view'],
            'ShaWorkerDetails': ['view'],
            'ShaEquipmentConclusion': ['view'],
            'User': ['view'],
            'Division': ['view'],
            'Subdivision': ['view'],
            'Facility': ['view'],
            'Equipment': ['view'],
            'CommunicationNetwork': ['view'],
            'CommunicationPost': ['view'],
            'FacilityType': ['view'],
            'Task': ['view', 'add', 'change', 'delete'],
            'EquipmentCategory': ['view'],
            'StorageFolder': ['view', 'add', 'change', 'delete'],
            'StorageFile': ['view', 'add', 'change', 'delete'],
        },
        'filters': {
            'Task': {'division_id': 1},
        },
        'can_see_all_divisions': True,
        'can_access_storage': True,
        'can_see_all_storage': False,
        'storage_quota': 5 * 1024 * 1024 * 1024,
        'max_file_size': 50 * 1024 * 1024,
        'description': 'Полный просмотр, управление задачами 1 отдела'
    },
    
    'head_of_section_1_1': {
        'name': 'Начальник 1 отделения 1 отдела',
        'models': {
            'Employee': ['view'],
            'ShaWorkerDetails': ['view'],
            'ShaEquipmentConclusion': ['view'],
            'User': ['view'],
            'Division': ['view'],
            'Subdivision': ['view'],
            'Facility': ['view'],
            'Equipment': ['view'],
            'CommunicationNetwork': ['view'],
            'CommunicationPost': ['view'],
            'FacilityType': ['view'],
            'Task': ['view'],
            'EquipmentCategory': ['view'],
            'StorageFolder': ['view', 'add', 'change', 'delete'],
            'StorageFile': ['view', 'add', 'change', 'delete'],
        },
        'filters': {
            'Task': {'division_id': 1, 'subdivision_id': 1},
            # 'Equipment': {'is_closed': True},
            # 'Facility': {'is_closed': True},
        },
        'can_see_all_divisions': True,      # Только свое подразделение
        'can_access_storage': True,
        'can_see_all_storage': False,
        'storage_quota': 5 * 1024 * 1024 * 1024,
        'max_file_size': 50 * 1024 * 1024,
        'description': 'Просмотр всей информации без возможности изменений'
    },
    
    'hr_section_1_1': {
        'name': 'Сотрудник по личному составу 1 отделения 1 отдела',
        'models': {
            'Employee': ['view', 'add', 'change', 'delete'],
            'Task': ['view', 'add', 'change', 'delete'],
            'Division': ['view'],
            'Subdivision': ['view'],
            'ShaWorkerDetails': ['view'],
            'StorageFolder': ['view', 'add', 'change', 'delete'],
            'StorageFile': ['view', 'add', 'change', 'delete'],
        },
        'filters': {
            'Task': {'division_id': 1, 'subdivision_id': 1}
        },
        'can_see_all_divisions': True,      # Видит все подразделения
        'can_access_storage': True,
        'can_see_all_storage': False,
        'storage_quota': 5 * 1024 * 1024 * 1024,
        'max_file_size': 50 * 1024 * 1024,
        'description': 'Управление сотрудниками, задачи 1 отделения'
    },
    
    'tech_section_1_1': {
        'name': 'Сотрудник по технике 1 отделения 1 отдела',
        'models': {
            'Division': ['view'],
            'Subdivision': ['view'],
            'Equipment': ['view'],  
            'Facility': ['view', 'add', 'change'],
            'CommunicationPost': ['view'],
            'FacilityType': ['view', 'change'],
            'CommunicationNetwork': ['view', 'add', 'change', 'delete'],
            'Task': ['view', 'add', 'change', 'delete'],
            'EquipmentCategory': ['view'],
            'StorageFolder': ['view', 'add', 'change', 'delete'],
            'StorageFile': ['view', 'add', 'change', 'delete'],
            # Сетевые модели
            'NetworkInterface': ['view', 'change'],
            'VLAN': ['view', 'change'],
            'IPAddress': ['view', 'change'],
            'RoutingTable': ['view', 'change'],
            'ACL': ['view', 'change'],
        },
        'filters': {
            'Task': {'division_id': 1, 'subdivision_id': 1},
        },
        'can_see_all_divisions': True,
        'can_access_storage': True,
        'can_see_all_storage': False,
        'storage_quota': 5 * 1024 * 1024 * 1024,
        'max_file_size': 50 * 1024 * 1024,
        'description': 'Управление техникой и сетями связи 1 отдела'
    },
    
    'employee_section_1_2': {
        'name': 'Сотрудник 2 отделения 1 отдела',
        'models': {
            'Division': ['view'],
            'Subdivision': ['view'],
            'Employee': ['view', 'change'],         
            'Equipment': ['view'],
            'CommunicationPost': ['view'],
            'Facility': ['view', 'add', 'change'],
            'FacilityType': ['view', 'change'],
            'CommunicationNetwork': ['view'],
            'Task': ['view', 'add', 'change', 'delete'],
            'EquipmentCategory': ['view'],
            'StorageFolder': ['view', 'add', 'change', 'delete'],
            'StorageFile': ['view', 'add', 'change', 'delete'],
        },
        'filters': {
            'Equipment': {'category__value__in': ['tko', 'shd', 'shdTelephone']},
            'Facility': {'is_closed': True},
            'Task': {'division_id': 1, 'subdivision_id': 2}
        },
        'can_see_all_divisions': True,
        'is_editor_sha_worker': True,              
        'can_access_storage': True,
        'can_see_all_storage': False,
        'storage_quota': 5 * 1024 * 1024 * 1024,
        'max_file_size': 50 * 1024 * 1024,
        'description': 'Специализированный доступ для 2 отделения (только ШаРаботники)'
    },

    'tech_section_1_3': {
        'name': 'Сотрудник по технике 3 отделения 1 отдела',
        'models': {
            'Division': ['view'],
            'Subdivision': ['view'],
            'Equipment': ['view', 'add', 'change', 'delete'],
            'EquipmentCategory': ['view'],
            'Task': ['view', 'add', 'change', 'delete'],
            'StorageFolder': ['view', 'add', 'change', 'delete'],
            'StorageFile': ['view', 'add', 'change', 'delete'],
        },
        'filters': {
            'Task': {'division_id': 1, 'subdivision_id': 3}
        },
        'can_see_all_divisions': True,
        'can_access_storage': True,
        'can_see_all_storage': False,
        'storage_quota': 5 * 1024 * 1024 * 1024,
        'max_file_size': 50 * 1024 * 1024,
        'description': 'Управление техникой 3 отделения 1 отдела'
    },

    'exploitation_chief': {
        'name': 'Начальник подразделения эксплуатации',
        'models': {
            'Division': ['view'],
            'Subdivision': ['view'],
            'Employee': ['view'],
            'Equipment': ['view'],
            'Facility': ['view'],
            'CommunicationNetwork': ['view'],
            'Task': ['view', 'add', 'change', 'delete'],
            'Map': ['view'],
            'CommunicationPost': ['view'],
            'FacilityType': ['view'],
            'EquipmentCategory': ['view'],
            'InterestOrgan': ['view'],
            'StorageFolder': ['view', 'add', 'change', 'delete'],
            'StorageFile': ['view', 'add', 'change', 'delete'],
        },
        'filters': {},
        'can_see_all_divisions': False,      # Только свое подразделение
        'can_access_storage': True,
        'can_see_all_storage': True,
        'storage_quota': 5 * 1024 * 1024 * 1024,
        'max_file_size': 50 * 1024 * 1024,
        'description': 'Полный доступ к хранилищу'
    },

    'exploitation_employee': {
        'name': 'Сотрудник подразделения эксплуатации',
        'models': {
            'Division': ['view'],
            'Subdivision': ['view'],
            'Employee': ['view'],
            'Equipment': ['view', 'change'],
            'Facility': ['view'],
            'CommunicationNetwork': ['view', 'change'],
            'Task': ['view', 'add', 'change', 'delete'],
            'CommunicationPost': ['view', 'add', 'delete'],
            'FacilityType': ['view'],
            'EquipmentCategory': ['view'],
            'InterestOrgan': ['view'],
            'Map': ['view'],
            'StorageFolder': ['view', 'add', 'change', 'delete'],
            'StorageFile': ['view', 'add', 'change', 'delete'],
        },
        'filters': {},
        'can_see_all_divisions': False,      # Только свое подразделение
        'can_access_storage': True,
        'can_see_all_storage': True,
        'storage_quota': 5 * 1024 * 1024 * 1024,
        'max_file_size': 50 * 1024 * 1024,
        'description': 'Полный доступ к хранилищу'
    },
}

def get_group_name(role_name):
    return f"role_{role_name}"

def get_role_from_group(group_name):
    return group_name.replace('role_', '') if group_name.startswith('role_') else None