"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";

const page = () => {
  const [totalUsers, setTotalUsers] = useState("");
  const [recentSignups, setRecentSignups] = useState("");
  const fetchUsers = async () => {
    const res = await axios.get("/api/admin/dashboard/getUsers");
    setTotalUsers(res.data.totalActiveUsers);
  };
  const fetchRecentSignups = async () => {
    const res = await axios.get("/api/admin/dashboard/getRecentSignups");
    setRecentSignups(res.data.newSignupsLastWeek);
  };
  useEffect(() => {
    fetchUsers();
    fetchRecentSignups();
  }, []);
  return (
    <div>
      <h1>Hello</h1>
      <h4>TotalActiveUsers: {totalUsers}</h4>
      <h4>Recent Signups: {recentSignups}</h4>
    </div>
  );
};

export default page;
