import React, { useState } from 'react';
import { RoutingTable } from '../../../../../../types';
import { networksApi } from '../../../../../../api/networksApi';
import { Card, Button, Form, Input, InputNumber } from 'antd';
import { Edit, Save, X } from 'lucide-react';

const { TextArea } = Input;

interface RouteCardProps {
  data: RoutingTable;
  token: string;
  onUpdate: () => void;
}

export function RouteCard({ data, token, onUpdate }: RouteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      await networksApi.updateRoutingTable(token, data.id, values);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Ошибка обновления маршрута:', error);
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
          <Form.Item label="Сеть назначения" name="network" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          
          <Form.Item label="Маска сети" name="netmask" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Шлюз" name="gateway" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Метрика" name="metric" rules={[{ required: true }]}>
            <InputNumber min={1} />
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
            <h4>{data.network}/{data.netmask} → {data.gateway}</h4>
            <Button 
              type="text" 
              icon={<Edit size={14} />} 
              onClick={() => setIsEditing(true)}
            />
          </div>
          <p><strong>Метрика:</strong> {data.metric}</p>
          {data.description && <p>{data.description}</p>}
        </div>
      )}
    </Card>
  );
}