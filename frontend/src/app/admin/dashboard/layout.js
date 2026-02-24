// layouts/AdminLayout.js
import AdminSidebar from '../../components/AdminSidebar';

const AdminLayout = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-black overflow-hidden relative">
            <AdminSidebar />
            <main className="flex-grow bg-black relative w-full lg:w-auto overflow-y-auto">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
