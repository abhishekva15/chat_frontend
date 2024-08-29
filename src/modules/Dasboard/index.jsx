import React, { useEffect, useRef } from "react";
// import {useNavigate} from 'react-router-dom'
import avatar from "../../assets/profile.png";
import Input from "../../components/Input";
import { useState } from "react";
import { io } from "socket.io-client";

function Dashboard() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user:details"))
  );
  const [conversations, setConversations] = useState([]);
  // const [messages, setMessages] = useState({});
  const [messages, setMessages] = useState({
    messages: [],
    receiver: null,
    conversationId: null,
  });

  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const chatContainerRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [activeUser, setActiveUser] = useState([]);
  // const navigate = useNavigate();

  // console.log("a ll message", messages);
  // console.log("User->", user);
  // console.log("Conversation", conversations);
  // console.log("Active Con", conversations.user?.receiverId);
  // console.log("People", users);

  // useEffect(() => {
  //   setSocket(io("http://localhost:4000"));
  // }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const socketConnection = io("http://localhost:4000");
    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  useEffect(() => {
    const socketConnection = io("http://localhost:4000");
    setSocket(socketConnection);

    socketConnection.emit("addUser", user?._id);

    socketConnection.on("getUsers", (activeUsers) => {
      console.log("Active Users:", activeUsers);
      setActiveUser(activeUsers);
    });

    socketConnection.on("getMessage", (data) => {
      setMessages((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          { user: data.senderId, message: data.message },
        ],
      }));
    });

    socketConnection.on("typing", ({ senderId }) => {
      if (senderId !== user._id) {
        setIsTyping(true);
        if (typingTimeout) clearTimeout(typingTimeout);
        setTypingTimeout(
          setTimeout(() => {
            setIsTyping(false);
          }, 2000)
        );
      }
    });

    return () => {
      socketConnection.disconnect();
      socketConnection.off("getUsers");
      socketConnection.off("getMessage");
      socketConnection.off("typing");
    };
  }, []);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user:details"));
    // console.log("User id", loggedInUser._id);
    const fetchConversation = async () => {
      const res = await fetch(
        `http://localhost:4000/api/v1/conversation/${loggedInUser?._id}`,
        {
          method: "GET",
          headers: {
            "content-Type": "application/json",
          },
        }
      );
      const resData = await res.json();
      // console.log("responce data->", resData);
      setConversations(resData);
    };
    fetchConversation();
  }, [conversations]);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch(
        `http://localhost:4000/api/v1/allUser/${user?._id}`,
        {
          method: "GET",
          headers: {
            "content-Type": "application/json",
          },
        }
      );
      const resData = await res.json();
      setUsers(resData);
    };
    fetchUser();
  }, []);

  const fetchMessage = async (conversationId, receiver) => {
    const res = await fetch(
      `http://localhost:4000/api/v1/message/${conversationId}?senderId=${user._id}&&receiverId=${receiver?.receiverId}`,
      {
        methos: "GET",
        headers: {
          "content-Type": "application/json",
        },
      }
    );
    const resData = await res.json();
    // console.log("resdata message ", resData);
    setMessages({ messages: resData, receiver, conversationId });
  };

  const sendMessage = async () => {
    try {
      if (
        !message ||
        !user?._id ||
        !messages?.conversationId ||
        !messages?.receiver?.receiverId
      ) {
        console.warn("Required data is missing. Cannot send message.");
        return;
      }

      socket.emit("sendMessage", {
        conversationId: messages?.conversationId,
        senderId: user?._id,
        message,
        receiverId: messages?.receiver?.receiverId,
      });

      const res = await fetch("http://localhost:4000/api/v1/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: messages?.conversationId,
          senderId: user?._id,
          message,
          receiverId: messages?.receiver?.receiverId,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to send message: ${res.statusText}`);
      }

      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);

    if (socket && messages?.conversationId && messages?.receiver?.receiverId) {
      socket.emit("typing", {
        conversationId: messages?.conversationId,
        senderId: user._id,
      });
    }
  };

  // const handleLogout = () => {
  //   localStorage.removeItem("user:details");
    
    
  //   navigate("/user/sign_in");
  // };

  return (
    <div className="w-screen bg-[#edf3fc] h-screen flex justify-center items-center">
      <div className="w-[25%] border-black h-screen bg-secondary">
        <div className="flex my-6 mx-12">
          <div className="border-2 border-primary rounded-full">
            <img src={avatar} width={65} height={65} alt="Profile" />
          </div>
          <div className="ml-8">
            <h3 className="text-2xl font-semibold">{user.fullname}</h3>
            <p className="text-lg font-light">My Account</p>
          </div>
          {/* <button onClick={handleLogout}>LogOut</button> */}
        </div>
        <hr />
        <div className="overflow-y-auto no-scrollbar">
          <div className="mx-8 mt-3 h-[calc(100vh-150px)] ">
            <div className="text-lg font-semibold mb-3 text-primary">
              Message
            </div>
            <div>
              {conversations.length > 0 ? (
                conversations.map(({ conversationId, user }, index) => {
                  return (
                    <div
                      key={index}
                      className="flex items-center py-4 border-b border-b-gray-300"
                    >
                      <div
                        className="cursor-pointer flex items-center relative "
                        onClick={() => fetchMessage(conversationId, user)}
                      >
                        <div className="border border-primary rounded-full relative">
                          <img
                            src={avatar}
                            width={40}
                            height={40}
                            alt={"name"}
                          />
                          {/*Active Icon*/}
                          <div className="absolute top-0 right-0">
                            {activeUser.map((users) =>
                              users.userId === user.receiverId ? (
                                <span className="text-green-500">
                                  <div className="rounded-full w-2 h-2 bg-green-500"></div>
                                </span>
                              ) : (
                                <span className="text-white"></span>
                              )
                            )}
                          </div> 
                        </div>

                        <div className="ml-5">
                          <h3 className="text-sm ">{user.fullname}</h3>
                          <p className="text-xs font-light text-gray-800">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-lg font-samibold mt-24">
                  {" "}
                  No Conversations
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-[50%] border-black h-screen bg-white flex flex-col items-center">
        {messages?.receiver?.fullname && (
          <div className="w-[75%] bg-secoundary h-[60px] mt-5 shadow-lg rounded-full flex items-center justify-between mb-5">
            <div className="flex ">
              <div className="mx-2 cursor-pointer">
                <img src={avatar} width={50} height={50} alt="profile " />
              </div>
              <div className="mx-2 mt-1">
                <h3 className="text-base">{messages?.receiver?.fullname}</h3>
                {/* <p className="text-xs font-light text-gray-800">
                  {messages?.receiver?.email}
                </p> */}
                <div>
                  {isTyping && (
                    <div className="text-gray-500 italic text-xs">
                      Typing...
                    </div>
                  )}
                </div>
              </div>
              {/* <div className="flex items-center">
                {isTyping && (
                  <div className="text-gray-500 italic text-xs">Typing...</div>
                )}
              </div> */}
            </div>
            {/*User Active */}
            <div className="mx-6 ">
              {activeUser.map((user) =>
                user.userId === messages?.receiver?.receiverId ? (
                  <span className="text-green-500">
                    <div className="rounded-full w-3 h-3 bg-green-500"></div>
                  </span>
                ) : (
                  <span className="text-white"></span>
                )
              )}
            </div> 
          </div>
        )}
        <div
          className="h-[75%] w-full overflow-y-auto no-scrollbar"
          ref={chatContainerRef}
        >
          <div className="h-[calc(100vh-150px)] px-8 ">
            {Array.isArray(messages?.messages) &&
            messages.messages.length > 0 ? (
              messages.messages.map(
                ({ message, user: { id }, user: messageUserId }, index) => {
                  if (id === user?._id || messageUserId === user?._id) {
                    return (
                      <div
                        key={index}
                        className="max-w-[45%] bg-secoundary rounded-b-xl rounded-tl-xl ml-auto mt-2 p-3"
                      >
                        {message}
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={index}
                        className="max-w-[45%] bg-blue-400 rounded-b-xl rounded-tr-xl p-3 mb-2"
                      >
                        {message}
                      </div>
                    );
                  }
                }
              )
            ) : (
              <div className="text-center text-lg font-semibold mt-56">
                No messages
              </div>
            )}
          </div>
        </div>
        {messages?.receiver?.fullname && (
          <div className="p-4 w-[100%] px-8 flex items-center ">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={handleTyping}
              className="w-full shadow-lg bg-secoundary outline-none rounded-full"
              inputClassName="border-0 w-[85%]"
            />
            <div
              className={`mx-auto cursor-pointer bg-secoundary p-3 rounded-full shadow-lg ${
                !message && "pointer-events-none"
              }`}
              onClick={() => sendMessage()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="icon icon-tabler icons-tabler-outline icon-tabler-send"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M10 14l11 -11" />
                <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="w-[25%] bg-light px-8 py-16 h-screen">
        <div className="text-lg font-semibold mb-3 text-primary">People</div>
        <div className="overflow-y-auto no-scrollbar">
          <div className=" mt-3 h-[calc(100vh-150px)] ">
            {users.length > 0 ? (
              users.map(({ userId, user }, index) => {
                // console.log("New wala user->", user)
                return (
                  <div
                    key={index}
                    className="flex items-center py-4 border-b border-b-gray-300"
                  >
                    <div
                      className="cursor-pointer flex items-center "
                      onClick={() => fetchMessage("new", user)}
                    >
                      <div className="border border-primary rounded-full relative">
                        <div className="relative">
                          <img
                            src={avatar}
                            width={50}
                            height={50}
                            alt={"name"}
                          />
                        </div>
                        <div className="absolute top-1 right-0">
                          {activeUser.map((users) =>
                            users.userId === user.receiverId ? (
                              <span className="text-green-500">
                                <div className="rounded-full w-2 h-2 bg-green-500"></div>
                              </span>
                            ) : (
                              <span className="text-white"></span>
                            )
                          )}
                        </div> 
                      </div>
                      <div className="ml-8">
                        <h3 className="text-base">{user.fullname}</h3>
                        <p className="text-xs font-light text-gray-800">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-lg font-samibold mt-24">
                {" "}
                No Conversations
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
