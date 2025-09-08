import React, { useState } from 'react';
import { ACL } from '../../../../../../types';
import { networksApi } from '../../../../../../api/networksApi';
import { Card, Button, Form, Input, Select, InputNumber } from 'antd';
import { Edit, Save, X } from 'lucide-react';

const { Option } = Select;
const { TextArea } = Input;

interface ACLCardProps {
  data: ACL;
  token: string;
  onUpdate: () => void;
}

export function ACLCard({ data, token, onUpdate }: ACLCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      await networksApi.updateACL(token, data.id, values);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Ошибка обновления ACL:', error);
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
          <Form.Item label="Название ACL" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          
          <Form.Item label="Порядковый номер" name="sequence" rules={[{ required: true }]}>
            <InputNumber min={1} />
          </Form.Item>

          <Form.Item label="Действие" name="action" rules={[{ required: true }]}>
            <Select>
              <Option value="permit">Permit</Option>
              <Option value="deny">Deny</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Протокол" name="protocol" rules={[{ required: true }]}>
            <Select>
              <Option value="ip">IP</Option>
              <Option value="tcp">TCP</Option>
              <Option value="udp">UDP</Option>
              <Option value="icmp">ICMP</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Источник" name="source_network">
            <Input />
          </Form.Item>

          <Form.Item label="Назначение" name="destination_network">
            <Input />
          </Form.Item>

          <Form.Item label="Порт источника" name="source_port">
            <InputNumber min={1} max={65535} />
          </Form.Item>

          <Form.Item label="Порт назначения" name="destination_port">
            <InputNumber min={1} max={65535} />
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
            <h4>{data.name} (seq {data.sequence})</h4>
            <Button 
              type="text" 
              icon={<Edit size={14} />} 
              onClick={() => setIsEditing(true)}
            />
          </div>
          <p><strong>Действие:</strong> {data.action === 'permit' ? 'Разрешить' : 'Запретить'}</p>
          <p><strong>Протокол:</strong> {data.protocol}</p>
          {data.source_network && <p><strong>Источник:</strong> {data.source_network}</p>}
          {data.destination_network && <p><strong>Назначение:</strong> {data.destination_network}</p>}
          {data.source_port && <p><strong>Порт источника:</strong> {data.source_port}</p>}
          {data.destination_port && <p><strong>Порт назначения:</strong> {data.destination_port}</p>}
          {data.description && <p>{data.description}</p>}
        </div>
      )}
    </Card>
  );
}