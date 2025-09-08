import React, { useState } from 'react';
import { IPAddress } from '../../../../../../types';
import { networksApi } from '../../../../../../api/networksApi';
import { Card, Button, Form, Input, Select, Switch } from 'antd';
import { Edit, Save, X } from 'lucide-react';

const { Option } = Select;
const { TextArea } = Input;

interface IPAddressCardProps {
  data: IPAddress;
  token: string;
  onUpdate: () => void;
}

export function IPAddressCard({ data, token, onUpdate }: IPAddressCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      await networksApi.updateIPAddress(token, data.id, values);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Ошибка обновления IP-адреса:', error);
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
          <Form.Item label="IP-адрес" name="address" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          
          <Form.Item label="Маска/префикс" name="netmask" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Версия IP" name="version" rules={[{ required: true }]}>
            <Select>
              <Option value="IPv4">IPv4</Option>
              <Option value="IPv6">IPv6</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Основной адрес" name="is_primary" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="Шлюз" name="gateway">
            <Input />
          </Form.Item>

          <Form.Item label="DNS-серверы" name="dns_servers">
            <TextArea rows={2} placeholder="Разделите серверы запятой" />
          </Form.Item>

          <Form.Item label="Комментарий" name="description">
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
            <h4>{data.address}/{data.netmask} ({data.version})</h4>
            <Button 
              type="text" 
              icon={<Edit size={14} />} 
              onClick={() => setIsEditing(true)}
            />
          </div>
          {data.is_primary && <span className="badge">Основной</span>}
          {data.gateway && <p><strong>Шлюз:</strong> {data.gateway}</p>}
          {data.dns_servers && <p><strong>DNS:</strong> {data.dns_servers}</p>}
          {data.description && <p>{data.description}</p>}
        </div>
      )}
    </Card>
  );
}