import React, { useState, useContext }from 'react';
import { Card, CardContent, Typography, Grid, CardActionArea, Button, TextField, Tooltip } from '@mui/material';
import { Link } from 'react-router-dom';
import { PeopleAltOutlined, EventAvailableTwoTone, CurrencyExchangeTwoTone, BookOnlineTwoTone, BookTwoTone, SchoolTwoTone, PersonSearch, Image, DataObject, Dataset, AddModeratorTwoTone, AdminPanelSettingsSharp, Analytics, ReceiptLong } from '@mui/icons-material'; // Import Material-UI icons
import { verifyAdminAndRole } from '../utils/firebaseUtils';
import {AuthContext} from '../context/AuthProvider';
import { darkThemeStyles, lightThemeStyles } from '../constants';

// NOT import {AuthProvider} from '../context/AuthProvider';
// Cannot destructure property 'login' of '(0 , react__WEBPACK_IMPORTED_MODULE_0__.useContext)(...)' as it is undefined.

function LandingPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    const { login, isAdmin, user, role, darkMode } = useContext(AuthContext);

    //console.log(isAdmin,user,role)


    const handleLogin = async () => {
        const result = await verifyAdminAndRole(email, password);
        if (result.success) {
            login({ username: email, role:result.role ,isLoggedIn:true }); // true to yes
            window.location.reload();
        } else {
            setLoginError(result.message);
        }
    };

    

    const cardData = [
        { title: "Transactions", subtitle: "View and manage transactions here.", link: "/transactions", icon: <CurrencyExchangeTwoTone /> },
        { title: "Studios", subtitle: "View and manage studios here.", link: "/studios", icon: <SchoolTwoTone /> },
        { title: "Studios Add/Update", subtitle: "View and edit studios here.", link: "/studiosCrud", icon: <SchoolTwoTone /> },
        { title: "User KYCs", subtitle: "View and manage user KYCs here.", link: "/user-kycs", icon: <BookTwoTone /> },
        { title: "Workshops", subtitle: "View and manage workshops here.", link: "/workshops", icon: <EventAvailableTwoTone /> },
        { title: "Users", subtitle: "View and manage users here.", link: "/users", icon: <PeopleAltOutlined/> },
        { title: "Bookings", subtitle: "View and manage bookings here.", link: "/bookings", icon: <BookOnlineTwoTone /> },
        { title: "Workshop Bookings", subtitle: "Monitor workshop bookings with date filters.", link: "/workshopBookings", icon: <ReceiptLong /> },
        { title: "Instructors", subtitle: "View and manage instructors here.", link: "/instructors", icon: <PersonSearch /> },
        { title: "Admin Mgmt", subtitle: "View and manage admin here.", link: "/adminMgmt", icon: <AddModeratorTwoTone /> },
        { title: "Carousel Images", subtitle: "View and manage carousel images here.", link: "/carouselImgMgmt", icon: <Image /> },
        { title: "Page Tracking", subtitle: "View page tracking analytics and user behavior.", link: "/pageTracking", icon: <Analytics /> },
        { title: "Data", subtitle: "View and manage cites & danceforms data here.", link: "/data", icon: <Dataset /> }
    ];

    if (isAdmin) {
        return (
            <div >
                <br />
                <Grid container spacing={3}>
                    {cardData.sort((a, b) => a.title.localeCompare(b.title)).map((item, index) => (
                        <Grid key={index} item xs={12} sm={6} md={4} lg={4} disabled={role !== '1'}>
                            <Link to={item.link} style={{ textDecoration: "none" }}>
                                <Card className="hoverEffect">
                               
                                    <CardActionArea>
                                        <CardContent>
                                            <Typography variant="h5" component="h2">
                                                {item.title} {item.icon}
                                            </Typography>
                                            <Tooltip title="Super Admin Access Only">
                                                {(item.title === "Data" || item.title === "Admin Mgmt") && (
                                                        <div style={{ position: "absolute", top: "10px", right: "10px" }}>
                                                            <AdminPanelSettingsSharp sx={{ color: 'orange' }} />
                                                        </div>    
                                                )}
                                            </Tooltip>
                                            <Typography color="text.secondary">
                                                {item.subtitle}
                                            </Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Link>
                        </Grid>
                    ))}
                </Grid>
                
            </div>
        );
    } else {
        return (
            <div style={{ maxWidth: "300px", margin: "auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <br></br>
                <TextField
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    margin="normal"
                    type='email'
                    
                />
                <TextField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    margin="normal"
                />
                <Button variant="contained" color="primary" onClick={handleLogin} style={darkMode ? darkThemeStyles.toggleButton : lightThemeStyles.toggleButton}>
                    Login
                </Button>
                {loginError && <Typography color="error">{loginError}</Typography>}
            </div>

        );
    }
}

export default LandingPage;

/*

{item.title === "Data" || item.title === "Admin Mgmt" ? (
                                                
        <div style={{ position: "absolute", top: "10px", right: "10px" }}>
            <AdminPanelSettingsSharp sx={{ color: 'orange' }} />
        </div>
    
):""}


{(item.title === "Data" || item.title === "Admin Mgmt") && (
                                                
        <div style={{ position: "absolute", top: "10px", right: "10px" }}>
            <AdminPanelSettingsSharp sx={{ color: 'orange' }} />
        </div>
    
)}

{item.title === "Data" || item.title === "Admin Mgmt" && (
                                                
                                                    <div style={{ position: "absolute", top: "10px", right: "10px" }}>
                                                        <AdminPanelSettingsSharp sx={{ color: 'orange' }} />
                                                    </div>
                                                
                                            )}                                   

Not working
*/