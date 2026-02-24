"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

const LogoutPage = () => {
    const router = useRouter();
    const { logoutAdmin } = useAuth();

    useEffect(() => {
        const doLogout = async () => {
            await logoutAdmin();
            router.push('/admin/');
        };

        doLogout();
    }, [router, logoutAdmin]);

    return null;
};

export default LogoutPage;