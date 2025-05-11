import { Admin, Resource } from "react-admin";
import { Layout } from "./Layout";
import authProvider from "./authProvider";
import dataProvider from "./dataProvider";
import { UserList, UserShow } from "../src/resources/userResource";
import { WarrantyList, WarrantyEdit, WarrantyShow } from "./resources/warrantyResource";
import LoginPage from "./components/LoginPage";
import PeopleIcon from "@mui/icons-material/People";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";

// Custom dashboard component
import Dashboard from "./components/Dashboard";

// Empty component to use for hiding resources from menu
const EmptyList = () => null;

export const App = () => {
  console.log("Starting warranty admin application");
  
  return (
    <Admin
      title="Warranty Admin Dashboard"
      layout={Layout}
      loginPage={LoginPage}
      authProvider={authProvider}
      dataProvider={dataProvider}
      dashboard={Dashboard}
      requireAuth
      disableTelemetry
    >
      <Resource
        name="users"
        list={UserList}
        show={UserShow}
        icon={PeopleIcon}
        options={{ label: "Users" }}
      />
      {/* Warranty resource is hidden from the menu but still available for direct access */}
      <Resource
        name="warranties"
        edit={WarrantyEdit}
        show={WarrantyShow}
        list={EmptyList}
        icon={VerifiedUserIcon}
        options={{ label: "Warranties" }}
      />
    </Admin>
  );
}; 