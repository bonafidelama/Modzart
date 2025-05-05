import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

export default function LoginForm({ onSuccess }) {
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            await login(formData.username, formData.password);
            toast.success('Successfully signed in!');
            if (onSuccess) onSuccess();
        } catch (error) {
            const message = error.response?.data?.detail || error.message || 'Failed to sign in';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="w-full"
                    disabled={loading}
                />
            </div>

            <div>
                <Input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full"
                    disabled={loading}
                />
            </div>

            <Button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-black font-bold"
                disabled={loading}
            >
                {loading ? 'Signing in...' : 'Sign in'}
            </Button>
        </form>
    );
}