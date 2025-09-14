import React, { useContext } from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import {AuthContext} from '../context/AuthProvider';
import logo from './logo.png';
import { Box, Stack, Chip, IconButton, Tooltip } from '@mui/material';
import { 
  AdminPanelSettings, 
  Logout, 
  Brightness4, 
  Brightness7,
  Person 
} from '@mui/icons-material';

function Header() {

    const { isAdmin,user,role,logout,darkMode, toggleDarkMode } = useContext(AuthContext);
    console.log(isAdmin,role,user)

    const handleLogout = () => {
        logout()
        window.location.reload();

    };

    return (
        <AppBar 
            position="static" 
            elevation={0} 
            sx={{ 
                background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
                borderBottom: '1px solid #333333',
                backdropFilter: 'blur(10px)',
            }}
        >
            <Toolbar sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                minHeight: '64px',
                px: { xs: 2, sm: 3 }
            }}>
                {/* Logo and Brand Section */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        component="img"
                        src={logo}
                        alt="Nritya Logo"
                        sx={{
                            height: 42,
                            width: 'auto',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(103, 86, 158, 0.3)',
                        }}
                    />
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AdminPanelSettings sx={{ color: '#67569E', fontSize: '1.8rem' }} />
                            <Typography 
                                variant="h5" 
                                component="div" 
                                sx={{ 
                                    color: 'white',
                                    fontWeight: 'bold',
                                    letterSpacing: '0.5px',
                                    background: 'linear-gradient(45deg, #67569E 30%, #8B7AC8 90%)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                Nritya Admin
                            </Typography>
                        </Box>
                    </Link>
                </Box>

                {/* Right Section - Admin Controls */}
                {isAdmin && (
                    <Stack direction="row" spacing={2} alignItems="center">
                        {/* Dark Mode Toggle */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                                <IconButton
                                    onClick={toggleDarkMode}
                                    sx={{
                                        color: darkMode ? '#FFD700' : '#B0B0B0',
                                        '&:hover': {
                                            backgroundColor: 'rgba(103, 86, 158, 0.1)',
                                            color: '#67569E',
                                        },
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    {darkMode ? <Brightness7 /> : <Brightness4 />}
                                </IconButton>
                            </Tooltip>
                            <Typography variant="body2" sx={{ color: '#B0B0B0', fontSize: '0.8rem' }}>
                                {darkMode ? 'Dark' : 'Light'}
                            </Typography>
                        </Box>

                        {/* Role Badge */}
                        <Chip
                            icon={<Person />}
                            label={role === "1" ? "Super Admin" : "Admin"}
                            variant="outlined"
                            sx={{
                                color: '#67569E',
                                borderColor: '#67569E',
                                backgroundColor: 'rgba(103, 86, 158, 0.1)',
                                fontWeight: 'bold',
                                '&:hover': {
                                    backgroundColor: 'rgba(103, 86, 158, 0.2)',
                                },
                            }}
                        />

                        {/* Logout Button */}
                        <Tooltip title="Logout">
                            <Button
                                variant="contained"
                                onClick={handleLogout}
                                startIcon={<Logout />}
                                sx={{
                                    backgroundColor: '#67569E',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    px: 3,
                                    py: 1,
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    boxShadow: '0 2px 8px rgba(103, 86, 158, 0.3)',
                                    '&:hover': {
                                        backgroundColor: '#8B7AC8',
                                        boxShadow: '0 4px 12px rgba(103, 86, 158, 0.4)',
                                        transform: 'translateY(-1px)',
                                    },
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                Logout
                            </Button>
                        </Tooltip>
                    </Stack>
                )}
            </Toolbar>
        </AppBar>
    );
}

export default Header;
