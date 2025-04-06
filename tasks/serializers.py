from rest_framework import serializers
from .models import Task, TaskStep
from users.serializers import UserSerializer

class TaskStepSerializer(serializers.ModelSerializer):
    completed_by = UserSerializer(read_only=True)
    
    class Meta:
        model = TaskStep
        fields = [
            'id', 'name', 'comments', 'start_date', 'end_date',
            'is_completed', 'completed_by', 'completed_at',
            'created_at', 'updated_at'
        ]

class TaskSerializer(serializers.ModelSerializer):
    steps = TaskStepSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)
    division_name = serializers.CharField(source='division.name', read_only=True)
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'category', 'division', 'division_name', 'created_by',
            'steps', 'progress', 'created_at', 'updated_at'
        ]

    def get_progress(self, obj):
        total_steps = obj.steps.count()
        if not total_steps:
            return 0
        completed_steps = obj.steps.filter(is_completed=True).count()
        return (completed_steps / total_steps) * 100