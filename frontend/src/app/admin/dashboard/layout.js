// layouts/AdminLayout.js
import AdminSidebar from '../../components/AdminSidebar';

const AdminLayout = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-black overflow-hidden">
            <AdminSidebar />
            <main className="flex-grow bg-black relative">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
