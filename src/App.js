import Form from "./modules/Form";

import Dasboard from "./modules/Dasboard";
import { Routes, Route, Navigate } from "react-router-dom";

const ProtectedRout = ({ children , auth=false}) => {
  const isLogedIn = localStorage.getItem("user:token") !== null ;

  if (!isLogedIn && auth) {
    return <Navigate to={"/user/sign_in"} />;
  } else if(isLogedIn && ['/user/sign_in', '/user/sign_up'].includes(window.location.pathname)){
    
    return <Navigate to={'/'}/>
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRout auth={true}>
            <Dasboard />
          </ProtectedRout>
        }
      ></Route>
      <Route
        path="/user/sign_in"
        element={
          <ProtectedRout>
            <Form isSignInPage={true} />
          </ProtectedRout>
        }
      ></Route>
      <Route
        path="/user/sign_up"
        element={
          <ProtectedRout>
            <Form isSignInPage={false} />
          </ProtectedRout>
        }
      ></Route>
    </Routes>
    // <div className="bg-[#edf3fc] h-screen flex justify-center items-center">
    //   {/* <Form /> */}
    //   <Dasboard/>
    // </div>
  );
}

export default App;
