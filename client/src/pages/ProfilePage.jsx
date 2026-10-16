import { useAuth } from '../context/AuthContext';

function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="profile">
        <h1 className="profile__title">Личный кабинет</h1>
        <p className="profile__status">Загрузка...</p>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="profile">
        <h1 className="profile__title">Личный кабинет</h1>
        <p className="profile__status">
          Войдите, чтобы увидеть профиль. <Link to="/login">Войти</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="profile">
      <h1 className="profile__title">Личный кабинет</h1>
      <div className="profile__info">
        <p>Имя: {user.name}</p>
        <p>Email: {user.email}</p>
      </div>
    </div>
  );
}

export default ProfilePage;
