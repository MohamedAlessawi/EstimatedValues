// src/index.js
import React from "react";
import ReactDOM from "react-dom";
import { HashRouter, Route, Switch, Redirect } from "react-router-dom";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";

import AuthLayout from "layouts/Auth.js";
import AdminLayout from "layouts/Admin.js";
// import RTLLayout from "layouts/RTL.js";
import { AuthProvider } from "contexts/AuthContext";
import PrivateRoute from "components/PrivateRoute";
import { dynamicRoutes } from "routes.js";

const theme = extendTheme({
    direction: "ltr",
});

// مكون منفصل للمسارات
const AppContent = () => {
    return (
        <Switch>
            <Route path="/auth" component={AuthLayout} />
            <PrivateRoute path="/admin" component={AdminLayout} />
            {/*<PrivateRoute path="/rtl" component={RTLLayout} />*/}

            {/*/!* Dynamic routes *!/*/}
            {/*{dynamicRoutes.map((route, index) => (*/}
            {/*    <PrivateRoute*/}
            {/*        key={index}*/}
            {/*        path={route.layout + route.path}*/}
            {/*        component={route.component}*/}
            {/*    />*/}
            {/*))}*/}

            <Redirect from="/" to="/auth/signin" />
        </Switch>
    );
};

ReactDOM.render(
    <ChakraProvider theme={theme}>
        <HashRouter>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </HashRouter>
    </ChakraProvider>,
    document.getElementById("root")
);