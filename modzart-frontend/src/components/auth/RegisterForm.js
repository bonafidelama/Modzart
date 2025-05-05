import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

export default function RegisterForm({ onSuccess }) {
    const { register } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const userData = {
                username: formData.username,
                email: formData.email,
                password: formData.password
            };
            await register(userData);
            toast.success('Account created successfully!');
            if (onSuccess) onSuccess();
        } catch (error) {
            const message = error.response?.data?.detail || error.message || 'Registration failed';
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
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
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

            <div>
                <Input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
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
                {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
        </form>
    );
}