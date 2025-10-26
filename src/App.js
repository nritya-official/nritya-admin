// src/App.js
import React, { useContext } from "react";
import Footer from "./Components/Footer";
import LandingPage from "./Screens/LandingPage";
import Header from "./Components/Header";
import {
  BrowserRouter as Router,
  HashRouter,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import Transactions from "./Screens/Transactions";
import Users from "./Screens/Users";
import UserKycs from "./Screens/UserKycs";
import Studios from "./Screens/Studios";
import Workshops from "./Screens/Workshops";
import { Container } from "@mui/material";
import Bookings from "./Screens/Bookings";
import Instructors from "./Screens/Instructors";
import StudioCrud from "./Screens/StudioCrud";
import WorkshopCrud from "./Screens/WorkshopCrud";
import AdminMgmt from "./Screens/AdminMgmt";
import Tickets from "./Screens/Tickets";
import { ProtectedRoutes, ProtectedRoles } from "./utils/ProtectedRoutes";
import CarouselImgMgmt from "./Screens/CarouselImgMgmt";
import Data from "./Screens/Data";
import { AuthContext } from "./context/AuthProvider";
import "./App.css";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import UserKycsNew from "./Screens/UserKycsNew";
import Loader from "./Components/Loader";
import PageTracking from "./Screens/PageTracking";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function App() {
  const { darkMode } = useContext(AuthContext);

  return (
    <HashRouter>
      <Loader />
      <ThemeProvider theme={darkMode ? darkTheme : ""}>
        <CssBaseline />
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header />
          <br></br>
          <main className="py-1" style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route element={<ProtectedRoutes />}>
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/users" element={<Users />} />
                <Route path="/user-kycs" element={<UserKycsNew />} />
                <Route path="/studiosCrud" element={<StudioCrud />} />
                <Route path="/workshopsCrud" element={<WorkshopCrud />} />
                <Route path="/studios" element={<Studios />} />
                <Route path="/workshops" element={<Workshops />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/tickets" element={<Tickets />} />
                <Route path="/instructors" element={<Instructors />} />
                <Route path="/carouselImgMgmt" element={<CarouselImgMgmt />} />
                <Route path="/pageTracking" element={<PageTracking />} />
                <Route element={<ProtectedRoles roleInput={1} />}>
                  <Route path="/adminMgmt" element={<AdminMgmt />} />
                  <Route path="/data" element={<Data />} />
                </Route>
              </Route>
            </Routes>
          </main>
          <Footer />
        </div>
      </ThemeProvider>
    </HashRouter>
  );
}

export default App;
