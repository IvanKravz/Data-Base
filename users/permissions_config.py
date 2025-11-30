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
            'FacilityType': ['view''add', 'change', 'delete'],
            'EquipmentCategory': ['view', 'add', 'change', 'delete'],
        },
        'filters': {},
        'can_see_all_divisions': True,
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
        },
        'filters': {},
        'can_see_all_divisions': True,
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
        },
        'filters': {},
        'can_see_all_divisions': True,
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
            'Object': ['view'],
            'CommunicationNetwork': ['view'],
            'CommunicationPost': ['view'],
            'FacilityType': ['view'],
            'Task': ['view'],
            'EquipmentCategory': ['view'],
        },
        'filters': {
            'Task': {'division_id': 1},
        },
        'can_see_all_divisions': True,  # Только свое подразделение
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
            'Object': ['view'],
            'CommunicationPost': ['view'],
            'FacilityType': ['view'],
            'CommunicationNetwork': ['view'],
            'Task': ['view'],
            'EquipmentCategory': ['view'],
        },
        'filters': {},
        'can_see_all_divisions': True,  # Только свое подразделение
        'description': 'Просмотр всей информации без возможности изменений'
    },
    
    'hr_section_1_1': {
        'name': 'Сотрудник по личному составу 1 отделения 1 отдела',
        'models': {
            'Employee': ['view', 'add', 'change', 'delete'],
            'Task': ['view', 'add', 'change', 'delete'],
        },
        'filters': {
            'Employee': {'division_id': 1},
            'Task': {'division_id': 1, 'subdivision_id': 1}
        },
        'can_see_all_divisions': True,  # Только свое подразделение
        'description': 'Управление сотрудниками 1 отдела, задачи 1 отделения'
    },
    
    'tech_section_1_1': {
        'name': 'Сотрудник по технике 1 отделения 1 отдела',
        'models': {
            'Equipment': ['view', 'add', 'change'],
            'Object': ['view'],
            'CommunicationNetwork': ['view', 'add', 'change', 'delete'],
            'Task': ['view', 'add', 'change', 'delete'],
            'EquipmentCategory': ['view'],
        },
        'filters': {
            'Equipment': {'division_id': 1, 'is_closed': False},
            'Task': {'division_id': 1, 'subdivision_id': 1}
        },
        'can_see_all_divisions': True,  # Только свое подразделение
        'description': 'Управление техникой и сетями связи 1 отдела'
    },
    
    'employee_section_1_2': {
        'name': 'Сотрудник 2 отделения 1 отдела',
        'models': {
            'Employee': ['view', 'change'],
            'Equipment': ['view', 'change'],
            'Object': ['view', 'change'],
            'CommunicationNetwork': ['view'],
            'Task': ['view', 'add', 'change', 'delete'],
            'EquipmentCategory': ['view'],
        },
        'filters': {
            'Employee': {'is_sha_worker': True},
            'Equipment': {'is_closed': True},
            'Object': {'is_closed': True},
            'Task': {'division_id': 1, 'subdivision_id': 2}
        },
        'can_see_all_divisions': True,  # Только свое подразделение
        'description': 'Специализированный доступ для 2 отделения'
    },

    'exploitation_chief': {
    'name': 'Начальник подразделения эксплуатации',
    'models': {
        'Division': ['view'], 
        'Employee': ['view'],
        'Equipment': ['view'],
        'Facility': ['view'],
        'CommunicationNetwork': ['view'],
        'Task': ['view', 'add', 'change', 'delete'],
        'CommunicationPost': ['view'],
        'FacilityType': ['view'],
        'EquipmentCategory': ['view'],  
        'InterestOrgan': ['view'],     
    },
    'filters': {},
    'can_see_all_divisions': False,
    'description': 'Просмотр данных своего подразделения'
},

    'exploitation_employee': {
        'name': 'Сотрудник подразделения эксплуатации',
        'models': {
            'Division': ['view'],
            'Employee': ['view'],
            'Equipment': ['view', 'change'],
            'Facility': ['view'],
            'CommunicationNetwork': ['view', 'change'],
            'Task': ['view', 'add', 'change', 'delete'],
            'CommunicationPost': ['view', 'add', 'delete'],
            'FacilityType': ['view'],
            'EquipmentCategory': ['view'],  
            'InterestOrgan': ['view'],      
        },
        'filters': {},
        'can_see_all_divisions': False,
        'description': 'Полное управление данными своего подразделения'
    },
}

def get_group_name(role_name):
    return f"role_{role_name}"

def get_role_from_group(group_name):
    return group_name.replace('role_', '') if group_name.startswith('role_') else None