import React, { useCallback, useState } from 'react';
import {
    Card,
    CardContent,
    Button,
    TextField,
    Typography,
    Box,
    Tabs,
    Tab,
    CircularProgress
} from '@mui/material';
import { useLogin, useNotify } from 'react-admin';

// Type for tab panel props
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const useRegister = () => {
    const notify = useNotify();
    const login = useLogin();

    return useCallback(async (params: any) => {
        try {
            const authProvider = (await import('../authProvider')).default;
            await authProvider.register(params);
            await login({ username: params.username, password: params.password });
        } catch (error: any) {
            notify(error?.message || 'Registration failed', { type: 'error' });
        }
    }, [notify, login]);
};

// Tab Panel component to switch between login and register forms
function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`auth-tabpanel-${index}`}
            aria-labelledby={`auth-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

// Main Login Page component
const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const notify = useNotify();
    const login = useLogin();
    const register = useRegister();

    // Login form state
    const [loginValues, setLoginValues] = useState({
        username: '',
        password: '',
    });

    // Register form state
    const [registerValues, setRegisterValues] = useState({
        username: '',
        password: '',
        confirmPassword: '',
    });

    // Handle tab change
    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // Handle login form changes
    const handleLoginChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setLoginValues({
            ...loginValues,
            [name]: value,
        });
    };

    // Handle register form changes
    const handleRegisterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setRegisterValues({
            ...registerValues,
            [name]: value,
        });
    };

    // Handle login submission
    const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.log('Login attempt with username:', loginValues.username);
        setLoading(true);
        
        try {
            await login(loginValues);
            console.log('Login successful');
        } catch (error) {
            console.error('Login error:', error);
            notify('Login failed. Please check your credentials.', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Handle register submission
    const handleRegisterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.log('Registration attempt for:', registerValues.username);
        
        if (registerValues.password !== registerValues.confirmPassword) {
            notify('Passwords do not match', { type: 'error' });
            return;
        }
        
        setLoading(true);
        
        try {
            // Call the register function from authProvider
            await register({
                username: registerValues.username,
                password: registerValues.password,
            });
            console.log('Registration successful');
            notify('Registration successful. You can now log in.', { type: 'success' });
            setTabValue(0); // Switch to login tab after registration
        } catch (error) {
            console.error('Registration error:', error);
            notify('Registration failed. Please try again.', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: '#f5f5f5',
            }}
        >
            <Card 
                sx={{ 
                    maxWidth: 450,
                    width: '100%',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
            >
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} centered>
                        <Tab label="Login" />
                        <Tab label="Register" />
                    </Tabs>
                </Box>
                
                <CardContent>
                    <Typography
                        variant="h4"
                        component="h1"
                        gutterBottom
                        sx={{ textAlign: 'center', fontWeight: 'bold', my: 2 }}
                    >
                        Warranty Admin Dashboard
                    </Typography>

                    {/* Login Form */}
                    <TabPanel value={tabValue} index={0}>
                        <form onSubmit={handleLoginSubmit}>
                            <TextField
                                label="Username"
                                name="username"
                                value={loginValues.username}
                                onChange={handleLoginChange}
                                fullWidth
                                margin="normal"
                                variant="outlined"
                                required
                            />
                            <TextField
                                label="Password"
                                name="password"
                                type="password"
                                value={loginValues.password}
                                onChange={handleLoginChange}
                                fullWidth
                                margin="normal"
                                variant="outlined"
                                required
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                color="primary"
                                disabled={loading}
                                sx={{ mt: 3, mb: 2, py: 1.5 }}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Login'}
                            </Button>
                        </form>
                    </TabPanel>

                    {/* Register Form */}
                    <TabPanel value={tabValue} index={1}>
                        <form onSubmit={handleRegisterSubmit}>
                            <TextField
                                label="Username"
                                name="username"
                                value={registerValues.username}
                                onChange={handleRegisterChange}
                                fullWidth
                                margin="normal"
                                variant="outlined"
                                required
                            />
                            <TextField
                                label="Password"
                                name="password"
                                type="password"
                                value={registerValues.password}
                                onChange={handleRegisterChange}
                                fullWidth
                                margin="normal"
                                variant="outlined"
                                required
                            />
                            <TextField
                                label="Confirm Password"
                                name="confirmPassword"
                                type="password"
                                value={registerValues.confirmPassword}
                                onChange={handleRegisterChange}
                                fullWidth
                                margin="normal"
                                variant="outlined"
                                required
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                color="primary"
                                disabled={loading}
                                sx={{ mt: 3, mb: 2, py: 1.5 }}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Register'}
                            </Button>
                        </form>
                    </TabPanel>
                </CardContent>
            </Card>
        </Box>
    );
};

export default LoginPage; 