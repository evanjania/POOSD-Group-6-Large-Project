import { Route, Switch } from "wouter";
import AuthPage from "./pages/auth";
import DashboardPage from "./pages/dashboard";

function App() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/dashboard" component={DashboardPage} />
    </Switch>
  );
}

export default App;