import { collection, getDocs, getFirestore } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import './App.css';
import Profile from './Profile';

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
