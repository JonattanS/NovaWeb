import React from "react";
import { BrowserRouter } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import AppRoutes from "./App";

const AppRoot = () => {
  return (
    <UserProvider>
      <BrowserRouter>
        <AppRoutes/>
      </BrowserRouter>
    </UserProvider>
  );
};

export default AppRoot;
