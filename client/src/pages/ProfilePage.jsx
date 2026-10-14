import { useAuth } from '../context/AuthContext';

function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) return <p>Загрузка.....</p>;
  if (!user) return null;

  return (
    <div>
      <h1>Личный кабинет</h1>
      <p>Имя: {user.name}</p>
      <p>Email: {user.email}</p>
    </div>
  );
}

export default ProfilePage;
