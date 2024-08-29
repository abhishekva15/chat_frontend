
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/Input";
import Button from "../../components/Button";

function Form({ isSignInPage = false }) {
  const [data, setData] = useState({
    ...(!isSignInPage && {
      fullname: "",
    }),
    email: "",
    password: "",
  });

  const navigate = useNavigate(); 

  const handleNavigation = () => {
    navigate(`/user/${isSignInPage ? "sign_up" : "sign_in"}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Data ->", data);

    try {
      const res = await fetch(
        `http://localhost:4000/api/v1/${isSignInPage ? "login" : "register"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (res.status === 400) {
        alert("Invalid credentials. Please check your details.");
        return;
      }

      const resData = await res.json();

      if (res.ok && resData.token) {
        // Store token and user details
        localStorage.setItem("user:token", resData.token);
        localStorage.setItem("user:details", JSON.stringify(resData.user)); // Store user as a string

        // Redirect user after successful login/signup
        navigate("/");
      } else {
        alert(resData.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again later.");
    }
  };

  return (
    <div className="bg-[#edf3fc] h-screen flex justify-center items-center">
      <div className="bg-white w-[350px] h-[450px] shadow-lg rounded-lg flex flex-col justify-center items-center">
        <div className="text-3xl font-extrabold">
          Welcome {isSignInPage && "Back"}
        </div>
        <div className="text-lg font-light mb-5">
          {isSignInPage
            ? "Sign in to get explore"
            : "Sign Up now to get started"}
        </div>
        <form
          className="w-[100%] flex flex-col justify-center items-center"
          onSubmit={handleSubmit}
        >
          {!isSignInPage && (
            <Input
              label="Full Name"
              name="fullname"
              placeholder="Enter Your Name"
              className="mb-3"
              inputClassName="w-[70%]"
              value={data.fullname}
              onChange={(e) => setData({ ...data, fullname: e.target.value })}
            />
          )}
          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="Enter Your Email"
            className="mb-3"
            inputClassName="w-[70%]"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="Enter Your Password"
            className="mb-3"
            inputClassName="w-[70%]"
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
          />
          <Button label={isSignInPage ? "Sign In" : "Sign Up"} type="submit" />
        </form>
        <div className="text-xs">
          {isSignInPage
            ? "Didn't have an account? "
            : "Already have an account? "}
          <span
            className="text-primary hover:text-blue-700 cursor-pointer underline"
            onClick={handleNavigation}
          >
            {isSignInPage ? "Sign Up" : "Sign In"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Form;
 