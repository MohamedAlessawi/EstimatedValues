// routes.js
import Dashboard from "views/Dashboard/Dashboard";
import Tables from "views/Dashboard/Tables";
import Billing from "views/Dashboard/Billing";
import Profile from "views/Dashboard/Profile";
import SignIn from "views/Auth/SignIn.js";
import SignUp from "views/Auth/SignUp.js";
import Logout from "views/Auth/Logout.js";

// Colleges
import Colleges from "views/Dashboard/Colleges/Colleges";

// Year Stats
import YearStats from "views/Dashboard/YearStats/YearStats";

// Month Expenses
import MonthExpenses from "views/Dashboard/MonthExpenses/MonthExpenses";

// Predictions
import Predictions from "views/Dashboard/Predictions/Predictions";

import {
  HomeIcon,
  StatsIcon,
  CreditIcon,
  PersonIcon,
  DocumentIcon,
  RocketIcon,
  SupportIcon,
  BuildingIcon,
  CalendarIcon,
  MoneyIcon,
  ChartIcon,
} from "components/Icons/Icons";

var dashRoutes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    rtlName: "لوحة القيادة",
    icon: <HomeIcon color="inherit" />,
    component: Dashboard,
    layout: "/admin",
  },
  {
    path: "/colleges",
    name: "Colleges",
    rtlName: "الكليات",
    icon: <BuildingIcon color="inherit" />,
    component: Colleges,
    layout: "/admin",
  },
  {
    path: "/year-stats",
    name: "Year Statistics",
    rtlName: "إحصائيات السنة",
    icon: <CalendarIcon color="inherit" />,
    component: YearStats,
    layout: "/admin",
  },
  {
    path: "/month-expenses",
    name: "Monthly Expenses",
    rtlName: "المصروفات الشهرية",
    icon: <MoneyIcon color="inherit" />,
    component: MonthExpenses,
    layout: "/admin",
  },
  {
    path: "/predictions",
    name: "Predictions",
    rtlName: "التنبؤات",
    icon: <ChartIcon color="inherit" />,
    component: Predictions,
    layout: "/admin",
  },
  {
    path: "/logout",
    name: "Logout",
    rtlName: "تسجيل الخروج",
    icon: <DocumentIcon color="inherit" />,
    component: Logout,
    layout: "/auth",
  },
  {
    path: "/tables",
    name: "Tables",
    rtlName: "السجلات السابقة",
    icon: <StatsIcon color="inherit" />,
    component: Tables,
    layout: "/admin",
  },
  {
    path: "/billing",
    name: "Billing",
    rtlName: "الدفع",
    icon: <CreditIcon color="inherit" />,
    component: Billing,
    layout: "/admin",
  },
  {
    name: "ACCOUNT PAGES",
    category: "account",
    rtlName: "صفحات",
    state: "pageCollapse",
    views: [
      {
        path: "/profile",
        name: "Profile",
        rtlName: "معلومات الحساب",
        icon: <PersonIcon color="inherit" />,
        secondaryNavbar: true,
        component: Profile,
        layout: "/admin",
      },
      {
        path: "/signin",
        name: "Sign In",
        rtlName: "تسجيل دخول",
        icon: <DocumentIcon color="inherit" />,
        component: SignIn,
        layout: "/auth",
      },
      {
        path: "/signup",
        name: "Sign Up",
        rtlName: "التسجيل",
        icon: <RocketIcon color="inherit" />,
        secondaryNavbar: true,
        component: SignUp,
        layout: "/auth",
      },
    ],
  },
];

export default dashRoutes;