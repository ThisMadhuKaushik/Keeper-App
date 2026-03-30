import "./App.css";
import React, { useEffect, useState } from "react";

function Home() {
  const TODO = "TODO";
  const INPROGRESS = "INPROGRESS";
  const DONE = "DONE";
  const [token,setToken] = useState(localStorage.getItem("token"));
  const [user_id,setUser_id] = useState(localStorage.getItem("user_id"));
  const [val, setVal] = useState("");
  const [tasks, setTask] = useState([]);
  const [dragTask, setDragTask] = useState(null);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("TODO");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null); // jo task edit ho rha
  const [newTitle, setNewTitle] = useState(""); // naya title input
const API = import.meta.env.VITE_API_URL;
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

   const fetchTasks = async () => {
      setError("");
      if (!token || !user_id) {
        setError("You must be logged in!");
        return;
      }
      try {
        const response = await fetch(`${API}/users/${user_id}/tasks`,{
          headers: {
            Authorization: `Bearer ${token}`, // JWT token
          },
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.message || "Failed to fetch tasks");
          return;
        }
        setTask(data); // set state with fetched tasks
        console.log("Fetched tasks:", data);
      } catch (err) {
        console.error(err);
        setError("Something went wrong!");
      }
    };
 useEffect(() => {
    fetchTasks();
  }, []);

  function handleEditClick(task) {
  setCurrentTask(task);
  setNewTitle(task.title);
  setIsModalOpen(true); // modal open
}
async function handleUpdate() {
  // const token = localStorage.getItem("token");
  if (!token || !currentTask) return;
  try {
   const response = await fetch(`${API}/tasks/${currentTask.task_id}/title`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: newTitle }),
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data.error || "Failed to update");
      return;
    }
    setTask((prevTasks) =>
      prevTasks.map((task) =>
        task.task_id === currentTask.task_id ? { ...task, title: newTitle } : task
      )
    );
    setIsModalOpen(false);
    alert("Task updated successfully!");
  } catch (err) {
    console.error(err);
    alert("Something went wrong!");
  }
}
  function handleChange(event) {
    setVal(event.target.value);
  }
  async function  handleKeyDown(event) {
    if (event.key === "Enter" && val.trim() !== "") {
      const obj = {
        title: val,
        status: TODO,
        user_id:user_id,
      };
    event.preventDefault();
    setError("");
    setSuccess("");
    setTitle(val.trim());
    console.log(title);
    if(!token || !user_id) {
      setError("You must be logged in!");
      return;
    }
    try {
     const response = await fetch(`${API}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title : val,
          status,
          user_id,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to add task");
        return;
      }
       fetchTasks();
      // setTask((prevTask) => [...prevTask, obj]);
      setSuccess("Task added successfully!");
      setTitle(""); // clear input
      setStatus("TODO");
      console.log("Task:", data);
      console.log(tasks);
    } catch (err) {
      console.error(err);
      setError("Something went wrong!");
    }
      setVal("");
    }
  }

  function handleDragStart(e, task) {
    setDragTask(task);
  }

 async function handleDragNDrop(status) {
    let copyTask = [...tasks];
    try{
      //  const token = localStorage.getItem('token');
      const response = await fetch(`${API}/tasks/${dragTask.task_id}/status`,{
        method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: status}),
       })
       const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Failed to update");
      return;
    }
    }catch(err){
      console.error(err);
      console.log("some thing went wrong !");
    }
    copyTask = copyTask.map((item) => {
      if (dragTask.task_id === item.task_id) {
        item.status = status;
      }
      return item;
    }); 

    setTask(copyTask);
    setDragTask(null);
  }

  function handleOnDrop(e) {
    const newStatus = e.currentTarget.getAttribute("data-status");
    if (!dragTask) return;
   
    if (newStatus === TODO) {
      handleDragNDrop(TODO);
    } else if (newStatus === INPROGRESS) {
      handleDragNDrop(INPROGRESS);
    } else if (newStatus === DONE) {
      handleDragNDrop(DONE);
    }
  }

  function onDragOver(event) {
    event.preventDefault();
  }
  async function handleDelete(task_id) {
   if (!task_id) {
    alert("Task ID is missing!");
    return;
  }
console.log(task_id);
    // const token = localStorage.getItem("token"); 
     if (!token) {
    alert("You must be logged in!");
    return;
  }
  try{
    const response = await fetch(`${API}/tasks/${task_id}`,{
      method:"DELETE",
      headers:{
          "Content-Type": "application/json",
        Authorization: `Bearer ${token}` // send token
      }
    }
    );
     if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.error || "Failed to delete task");
      return;
    }
    const data = await response.json();
     setTask((prevTasks) => prevTasks.filter((task) => task.task_id !== task_id));
     alert("Task deleted successfully!");
    console.log("Deleted Task:", data.deletedTask);
    
  }
  catch (err) {
    console.error(err);
    alert("Something went wrong!");
  }
}

  return (
    <div className="App">
      <h1>Task Manager</h1>

      <input
        onChange={handleChange}
        type="text"
        value={val}
        onKeyDown={handleKeyDown}
        placeholder="Add a task and press Enter"
      />

      <div className="board">
        {/* Todo Column */}
        {isModalOpen && (
  <div className="modal-backdrop">
    <div className="modal">
      <h3>Edit Task</h3>
      <input
        type="text"
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
      />
      <button onClick={handleUpdate}>Save</button>
      <button onClick={() => setIsModalOpen(false)}>Cancel</button>
    </div>
  </div>
)}

        <div
          className="todo"
          data-status={TODO}
          onDrop={handleOnDrop}
          onDragOver={onDragOver}
        >
          <h2 className="todo-col">Todo</h2>
          {tasks.map(
            (task,index) =>
              task.status === TODO && (
                <div
                  onDragStart={(e) => handleDragStart(e, task)}
                  draggable = {true}
                  key={task.task_id || index}
                  className="task-item"
                >
                  {task.title}
                  <div className="btns">
                    <span className="btn" onClick={() => handleEditClick(task)}>✏️</span>
                    <span className="btn" onClick={() => handleDelete(task.task_id)}>
                      🗑️
                    </span>
                  </div>
                </div>
              )
          )}
        </div>

        {/* In Progress Column */}
        <div
          className="doing"
          data-status={INPROGRESS}
          onDrop={handleOnDrop}
          onDragOver={onDragOver}
        >
          <h2 className="doing-col">In-progress</h2>
          {tasks.map(
            (task , index) =>
              task.status === INPROGRESS && (
                <div
                  onDragStart={(e) => handleDragStart(e, task)}
                  draggable = {true}
                  key={task.task_id || index}
                  className="task-item"
                >
                  {task.title}
                  <div className="btns">
                    <span className="btn" onClick={() => handleEditClick(task)}>✏️</span>
                    <span className="btn" onClick={() => handleDelete(task.task_id)}>
                      🗑️
                    </span>
                  </div>
                </div>
              )
          )}
        </div>

        {/* Done Column */}
        <div
          className="done"
          data-status={DONE}
          onDrop={handleOnDrop}
          onDragOver={onDragOver}
        >
          <h2 className="done-col">Done</h2>
          {tasks.map(
            (task,index) =>
              task.status === DONE && (
                <div
                  onDragStart={(e) => handleDragStart(e, task)}
                  draggable = {true}
                  key={task.task_id ||index }
                  className="task-item"
                >
                  {task.title}
                  <div className="btns">
                    <span className="btn" onClick={() => handleEditClick(task)}>✏️</span>
                    <span className="btn" onClick={() => handleDelete(task.task_id)}>
                      🗑️
                    </span>
                  </div>
                </div>
              )
          )}
        </div>
      </div>
    </div> 
  );
}

export default Home;
