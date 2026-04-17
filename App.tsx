import { Route, Switch } from "wouter";
import AuthPage from "./pages/auth";
import DashboardPage from "./pages/dashboard";
import EditPass from "./components/editpass";

function App() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/dashboard" component={DashboardPage} />

      {/* the route captures the random token from the email link.*/}
      <Route path="/reset-pass/:token" component={EditPass} />
    </Switch>
  );
}

export default App;
