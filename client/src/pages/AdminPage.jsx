import {
  Admin,
  Resource,
  List,
  Datagrid,
  TextField,
  NumberField,
  SelectField,
  Edit,
  SimpleForm,
  SelectInput,
  fetchUtils,
  Create,
  BooleanField,
  BooleanInput,
  TextInput,
  useInput,
  useGetList,
  NumberInput,
} from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import './AdminPage.css';
import * as LucideIcons from 'lucide-react';
import { HelpCircle } from 'lucide-react';

const httpClient = (url, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  return fetchUtils.fetchJson(url, { ...options, headers });
};

const dataProvider = simpleRestProvider(
  'http://localhost:3000/api',
  httpClient
);

const OrderList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" label="№" />
      <TextField source="user_name" label="Клиент" />
      <NumberField
        source="total"
        label="Сумма"
        options={{ style: 'currency', currency: 'RUB' }}
      />
      <TextField source="createdAt" label="Дата" />
      <SelectField
        source="status"
        label="Статус"
        choices={[
          { id: 'new', name: 'Новый' },
          { id: 'accepted', name: 'Принят' },
          { id: 'cooking', name: 'Готовится' },
          { id: 'delivering', name: 'Доставляется' },
          { id: 'done', name: 'Выполнен' },
          { id: 'cancelled', name: 'Отменён' },
        ]}
      />
    </Datagrid>
  </List>
);

const OrderEdit = () => (
  <Edit>
    <SimpleForm>
      <TextField source="id" label="№" disabled />
      <TextField source="user_name" label="Клиент" disabled />
      <SelectInput
        source="status"
        label="Статус"
        choices={[
          { id: 'new', name: 'Новый' },
          { id: 'accepted', name: 'Принят' },
          { id: 'cooking', name: 'Готовится' },
          { id: 'delivering', name: 'Доставляется' },
          { id: 'done', name: 'Выполнен' },
          { id: 'cancelled', name: 'Отменён' },
        ]}
      />
    </SimpleForm>
  </Edit>
);

const IconInput = (props) => {
  const { field } = useInput(props);
  const iconName = field.value;

  const formattedName = iconName
    ? iconName
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
    : '';

  const IconComponent = LucideIcons[formattedName] || HelpCircle;
  const isValid = !!LucideIcons[formattedName];
  const validateIcon = (value) => {
    if (!value) return undefined;

    const formattedName = value
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    if (!LucideIcons[formattedName]) {
      return 'Такой иконки нет в библиотеке Lucide';
    }

    return undefined;
  };

  return (
    <div className="icon-input-wrapper">
      <TextInput
        {...props}
        fullWidth
        validate={validateIcon}
        helperText={
          iconName && !isValid
            ? 'Такой иконки нет в Lucide (проверьте название lucide.dev)'
            : 'Например: bread, coffee, cake'
        }
      />

      {iconName && (
        <div
          className={`icon-preview ${isValid ? 'icon-preview--valid' : 'icon-preview--invalid'}`}
        >
          <IconComponent size={28} />
        </div>
      )}
    </div>
  );
};
const CategoryList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" label="ID" />
      <TextField source="name" label="Название" />
      <TextField source="icon" label="Иконка (Lucide)" />
      <BooleanField source="is_active" label="Активна" />
    </Datagrid>
  </List>
);

const CategoryEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" label="Название" fullWidth />
      <IconInput source="icon" label="Иконка (Lucide)" />
      <BooleanInput
        source="is_active"
        label="Категория активна (видна на сайте)"
      />
    </SimpleForm>
  </Edit>
);

const CategoryCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" label="Название" fullWidth />
      <IconInput source="icon" label="Иконка (Lucide)" />
      <BooleanInput
        source="is_active"
        label="Категория активна"
        defaultValue={true}
      />
    </SimpleForm>
  </Create>
);
const CategorySelectInput = (props) => {
  const { data: categories, isLoading } = useGetList('admin/categories', {
    pagination: { page: 1, perPage: 100 },
  });

  if (isLoading) return <span>Загрузка категорий...</span>;

  const choices = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
  }));

  return <SelectInput {...props} choices={choices} emptyText="Без категории" />;
};

const ProductList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" label="ID" />
      <TextField source="name" label="Название" />
      <NumberField
        source="price"
        label="Цена"
        options={{ style: 'currency', currency: 'RUB' }}
      />
      <TextField source="category_name" label="Категория" />
      <BooleanField source="is_active" label="Активен" />
    </Datagrid>
  </List>
);

const ProductEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" label="Название" fullWidth />
      <NumberInput source="price" label="Цена" />
      <CategorySelectInput source="id_category" label="Категория" />
      <TextInput source="description" label="Описание" multiline fullWidth />
      <TextInput source="icon" label="Путь к картинке" fullWidth />
      <BooleanInput source="is_active" label="Товар активен (виден на сайте)" />
    </SimpleForm>
  </Edit>
);

const ProductCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" label="Название" fullWidth />
      <NumberInput source="price" label="Цена" />
      <CategorySelectInput source="id_category" label="Категория" />
      <TextInput source="description" label="Описание" multiline fullWidth />
      <TextInput source="icon" label="Путь к картинке" fullWidth />
      <BooleanInput
        source="is_active"
        label="Товар активен"
        defaultValue={true}
      />
    </SimpleForm>
  </Create>
);

const BakeryList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" label="ID" />
      <TextField source="name" label="Название" />
      <TextField source="address" label="Адрес" />
      <TextField source="phone" label="Телефон" />
      <BooleanField source="is_active" label="Активна" />
    </Datagrid>
  </List>
);

const BakeryEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" label="Название" fullWidth />
      <TextInput source="address" label="Адрес" fullWidth />
      <TextInput source="phone" label="Телефон" fullWidth />
      <TextInput source="work_hours" label="Часы работы" fullWidth />
      <BooleanInput
        source="is_active"
        label="Пекарня активна (видна на сайте)"
      />
    </SimpleForm>
  </Edit>
);

const BakeryCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" label="Название" fullWidth />
      <TextInput source="address" label="Адрес" fullWidth />
      <TextInput source="phone" label="Телефон" fullWidth />
      <TextInput source="work_hours" label="Часы работы" fullWidth />
      <BooleanInput
        source="is_active"
        label="Пекарня активна"
        defaultValue={true}
      />
    </SimpleForm>
  </Create>
);

const UserList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" label="ID" />
      <TextField source="name" label="Имя" />
      <TextField source="email" label="Email" />
      <BooleanField source="is_admin" label="Админ" />
      <BooleanField source="is_active" label="Активен" />
    </Datagrid>
  </List>
);

const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="email" label="Email" disabled fullWidth />
      <TextInput source="name" label="Имя" fullWidth />
      <BooleanInput source="is_admin" label="Права администратора" />
      <BooleanInput
        source="is_active"
        label="Аккаунт активен (может входить)"
      />
    </SimpleForm>
  </Edit>
);

function AdminPage() {
  const { user, loading } = useAuth();
  console.log(user);
  if (loading) return <p className="admin__loading">Загрузка.....</p>;

  if (!user || user.is_admin !== 1) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-page">
      <Admin dataProvider={dataProvider} basename="/admin">
        <Resource name="admin/orders" list={OrderList} edit={OrderEdit} />
        <Resource
          name="admin/categories"
          list={CategoryList}
          edit={CategoryEdit}
          create={CategoryCreate}
        />
        <Resource
          name="admin/products"
          list={ProductList}
          edit={ProductEdit}
          create={ProductCreate}
        />
        <Resource
          name="admin/bakeries"
          list={BakeryList}
          edit={BakeryEdit}
          create={BakeryCreate}
        />
        <Resource name="admin/users" list={UserList} edit={UserEdit} />
      </Admin>
    </div>
  );
}

export default AdminPage;
