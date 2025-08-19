import { User, columns } from "./columns";
import { PageLayout } from "@/components/shared/PageLayout";
import { getUsers } from "@/lib/database";

const getData = async (): Promise<User[]> => {
  try {
    const users = await getUsers();
    
    // Transform database users to match the admin UI format
    return users.map(user => ({
      id: user.id,
      avatar: user.avatar_url || "/users/default.png",
      fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User',
      email: user.email,
      status: user.is_active ? "active" : "inactive",
      // Additional database fields
      phone: user.phone,
      date_of_birth: user.date_of_birth,
      is_admin: user.is_admin,
      last_login: user.last_login,
      created_at: user.created_at
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }

};

const UsersPage = async () => {
  const data = await getData();
  return (
    <PageLayout
      title="All Users"
      columns={columns}
      data={data}
      entityName="User"
    />
  );
};

export default UsersPage;
