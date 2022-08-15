import React, { useEffect, useState } from "react";
import logo from './logo.svg';
import './App.css';
import Weight from "./Weight";
import Profile from './Profile';
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { Col, Container, Row } from "react-bootstrap";

function App() {
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    getDocs(collection(getFirestore(), "profiles")).then((snapshot) => {
      setProfiles(snapshot.docs.map(x => x.id));
    });
  }, []);

  return (
    <Container fluid className="App">
      {profiles.map(id => <Profile key={id} id={id} />)}
    </Container>
  );
}

export default App;
