import React, { useState } from 'react';
import { VLAN } from '../../../../../../types';
import { networksApi } from '../../../../../../api/networksApi';
import { Card, Button, Form, Input, InputNumber } from 'antd';
import { Edit, Save, X } from 'lucide-react';

const { TextArea } = Input;

interface VLANCardProps {
  data: VLAN;
  token: string;
  onUpdate: () => void;
}

export function VLANCard({ data, token, onUpdate }: VLANCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      await networksApi.updateVlan(token, data.id, values);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Ошибка обновления VLAN:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setIsEditing(false);
  };

  return (
    <Card className="network-item-card" size="small">
      {isEditing ? (
        <Form
          form={form}
          initialValues={data}
          onFinish={handleSave}
          layout="vertical"
          size="small"
        >
          <Form.Item 
            label="VLAN ID" 
            name="vlan_id" 
            rules={[
              { required: true },
              { type: 'number', min: 1, max: 4094 }
            ]}
          >
            <InputNumber min={1} max={4094} />
          </Form.Item>
          
          <Form.Item label="Название" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Описание" name="description">
            <TextArea rows={2} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<Save size={14} />}>
              Сохранить
            </Button>
            <Button onClick={handleCancel} style={{ marginLeft: 8 }} icon={<X size={14} />}>
              Отмена
            </Button>
          </Form.Item>
        </Form>
      ) : (
        <div className="view-mode">
          <div className="item-header">
            <h4>VLAN {data.vlan_id} - {data.name}</h4>
            <Button 
              type="text" 
              icon={<Edit size={14} />} 
              onClick={() => setIsEditing(true)}
            />
          </div>
          {data.description && <p>{data.description}</p>}
        </div>
      )}
    </Card>
  );
}