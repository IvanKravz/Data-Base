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
            'Object': ['view', 'add', 'change', 'delete'],
            'CommunicationNetwork': ['view', 'add', 'change', 'delete'],
            'Task': ['view', 'add', 'change', 'delete'],
        },
        'filters': {},
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
            'Object': ['view'],
            'CommunicationNetwork': ['view'],
            'Task': ['view'],
        },
        'filters': {},
        'description': 'Просмотр всей информации без возможности изменений'
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
            'Equipment': ['view'],
            'Object': ['view'],
            'CommunicationNetwork': ['view'],
            'Task': ['view'],
        },
        'filters': {
            'Task': {'division_id': 1}
        },
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
            'Equipment': ['view'],
            'Object': ['view'],
            'CommunicationNetwork': ['view'],
            'Task': ['view'],
        },
        'filters': {},
        'description': 'Просмотр всей информации без возможности изменений'
    },
    
    'hr_section_1_1': {
        'name': 'Сотрудник по личному составу 1 отделения 1 отдела',
        'models': {
            'Employee': ['view', 'add', 'change', 'delete'],
            'Task': ['view', 'add', 'change', 'delete'],
        },
        'filters': {
            # Явно указываем подразделение в фильтрах роли
            'Employee': {'division_id': 1},
            'Task': {'division_id': 1, 'subdivision_id': 1}
        },
        'description': 'Управление сотрудниками 1 отдела, задачи 1 отделения'
    },
    
    'tech_section_1_1': {
        'name': 'Сотрудник по технике 1 отделения 1 отдела',
        'models': {
            'Equipment': ['view', 'add', 'change'],
            'Object': ['view'],
            'CommunicationNetwork': ['view', 'add', 'change', 'delete'],
            'Task': ['view', 'add', 'change', 'delete'],
        },
        'filters': {
            # Фильтры роли имеют приоритет над подразделением пользователя
            'Equipment': {'division_id': 1, 'is_closed': False},
            'Task': {'division_id': 1, 'subdivision_id': 1}
        },
        'description': 'Управление техникой и сетями связи 1 отдела'
    },
    
    'employee_section_1_2': {
        'name': 'Сотрудник 2 отделения 1 отдела',
        'models': {
            'Employee': ['view', 'change'],  # только шаработники
            'Equipment': ['view', 'change'],  # только закрытая
            'Object': ['view', 'change'],     # только закрытые
            'CommunicationNetwork': ['view'],
            'Task': ['view', 'add', 'change', 'delete'],
        },
        'filters': {
            'Employee': {'is_sha_worker': True},
            'Equipment': {'is_closed': True},
            'Object': {'is_closed': True},
            'Task': {'division_id': 1, 'subdivision_id': 2}
        },
        'description': 'Специализированный доступ для 2 отделения'
    },

    # Добавим роль, которая работает с любым подразделением
    'mobile_tech': {
        'name': 'Мобильный технический специалист',
        'models': {
            'Equipment': ['view', 'add', 'change'],
            'Object': ['view'],
        },
        'filters': {
            # Нет фильтра по division - значит будет использоваться подразделение пользователя
            'Equipment': {'is_closed': False}
        },
        'description': 'Доступ к технике в своем подразделении'
    }
}

def get_group_name(role_name):
    return f"role_{role_name}"

def get_role_from_group(group_name):
    return group_name.replace('role_', '') if group_name.startswith('role_') else None