import {
  CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, TimeScale, Title,
  Tooltip
} from "chart.js";
import "chartjs-adapter-date-fns";
import { doc, getFirestore, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { Button, Card, Form, Modal, Table } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import { BiCalendarCheck, BiTrendingDown, BiWalk } from "react-icons/bi";
import { BsCheckCircle, BsPencil } from "react-icons/bs";
import { CgClose } from "react-icons/cg";
import { GiBiceps, GiSmallFire } from "react-icons/gi";
import { GrAddCircle } from "react-icons/gr";
import { MdNoFood } from "react-icons/md";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
);

function dateToString(date) {
  return date.toISOString().split("T")[0];
}

function generateTrailingDates(end, count) {
  let dates = [];
  for (let ii = 0; ii < count; ++ii) {
    let date = new Date(end.getTime() - 1000 * 60 * 60 * 24 * ii);
    dates.push(date);
  }
  return dates;
}

function AddDataModal(props) {
  const { dialogOpen, setDialogOpen, profile, id, selectedDate } = props;
  const [weight, setWeight] = useState("");
  const [fasted, setFasted] = useState(false);
  const [cardio, setCardio] = useState(false);
  const [lifted, setLifted] = useState(false);
  const [blundered, setBlundered] = useState(false);
  const [date, setDate] = useState(dateToString(selectedDate ?? new Date()));
  const ref = useRef();

  const clearInput = () => {
    setDate(dateToString(new Date()));
    setWeight("");
    setFasted(false);
    setCardio(false);
    setLifted(false);
    setBlundered(false);
  };

  useEffect(() => {
    if (!profile || !(date in profile?.entries)) {
      clearInput();
    } else {
      setWeight(profile.entries[date]?.weight ?? false);
      setFasted(profile.entries[date]?.fasted ?? false);
      setCardio(profile.entries[date]?.cardio ?? false);
      setLifted(profile.entries[date]?.lifted ?? false);
      setBlundered(profile.entries[date]?.blundered ?? false);
    }
  }, [dialogOpen, profile, date]);

  return (
    <Modal show={dialogOpen} size="sm">
      <Modal.Header>
        <div className="d-flex align-items-center">Add data for {profile.name}</div>
        <CgClose className="pointer" onClick={() => setDialogOpen(false)} />
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex align-items-baseline mb-3 justify-content-between">
          <div style={{ width: "50px" }} className="me-3">
            Date
          </div>
          <input
            type="date"
            value={date}
            style={{ border: "1px solid #cfd4d9", padding: "0.25em", borderRadius: "5px" }}
            className="flex-grow-1"
            onChange={(event) => {
              setDate(event.target.value);
            }}
          />
        </div>
        <div className="d-flex align-items-baseline mb-3 justify-content-between">
          <Form.Label style={{ width: "50px" }} className="me-3">
            Weight
          </Form.Label>
          <Form.Control
            size="sm"
            type="number"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            ref={ref}
            style={{ borderRadius: "5px", backgroundColor: !weight && "#fff0f0" }}
          />
        </div>
        <Form.Check
          label="Fasted"
          checked={fasted}
          onChange={(event) => setFasted(event.target.checked)}
        />
        <Form.Check
          label="Cardio"
          checked={cardio}
          onChange={(event) => setCardio(event.target.checked)}
        />
        <Form.Check
          label="Lifted"
          checked={lifted}
          onChange={(event) => setLifted(event.target.checked)}
        />
        <Form.Check
          label="Blundered"
          checked={blundered}
          onChange={(event) => setBlundered(event.target.checked)}
          className="mb-4"
        />
        <div className="d-flex justify-content-between">
          <Button
            onClick={() => {
              if (!weight) {
                ref.current.focus();
                return;
              }
              const entry = {};
              entry[`entries.${date}`] = {
                weight: weight,
                fasted: fasted,
                cardio: cardio,
                lifted: lifted,
                blundered: blundered,
              };
              updateDoc(doc(getFirestore(), "profiles", id), entry)
                .then(setDialogOpen(false))
                .catch(console.error);
            }}
          >
            Save
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              let entry = {};
              entry[`entries.${date}`] = null;
              updateDoc(doc(getFirestore(), "profiles", id), entry)
                .then(setDialogOpen(false))
                .catch(console.error);
            }}
          >
            Delete
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default function Profile(props) {
  const [profile, setProfile] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [date, setDate] = useState();

  useEffect(() => {
    const db = getFirestore();
    onSnapshot(doc(db, "profiles", props.id), (snapshot) => {
      setProfile(snapshot.data());
    });
  }, [props.id]);

  let dates = Object.entries(profile?.entries ?? {})
    .map(([date, value]) => (value != null ? [date, new Date(date)] : null))
    .filter((x) => x != null);
  dates.sort((a, b) => b[1].getTime() - a[1].getTime()); // reverse

  const firstDate = dates.length > 0 && dates[dates.length - 1][1];
  const firstWeight = dates.length > 0 && profile?.entries[dates[dates.length - 1][0]]?.weight;
  const lastWeight = dates.length > 0 && profile?.entries[dates[0][0]]?.weight;
  const lastDate = dates.length > 0 && dates[0][1];
  const weightToLose = lastWeight - profile.target?.weight;
  const weightDown = firstWeight - lastWeight;
  let daysLeft = new Date(profile.target?.date).getTime() - new Date(lastDate).getTime();
  daysLeft /= 1000 * 60 * 60 * 24;
  let daysElapsed = new Date(lastDate).getTime() - new Date(firstDate).getTime();
  daysElapsed /= 1000 * 60 * 60 * 24;
  daysElapsed = Math.floor(daysElapsed);

  const trailingDates = lastDate && generateTrailingDates(lastDate, 3).map(dateToString);
  const trailingWeek = lastDate && generateTrailingDates(lastDate, 7).map(dateToString);
  const onRecordingStreak = trailingDates && trailingDates.every((x) => x in profile.entries);
  const averageWeight =
    onRecordingStreak &&
    trailingDates.map((x) => Number(profile.entries[x].weight)).reduce((acc, x) => acc + x) /
      trailingDates.length;
  const onWeightStreak = onRecordingStreak && lastWeight < averageWeight;
  const onFastingStreak =
    onRecordingStreak && trailingDates.every((x) => profile.entries[x].fasted);
  const onCardioStreak =
    trailingWeek &&
    trailingWeek.filter((x) => x in profile.entries && profile.entries[x].cardio).length >= 3;
  const onLiftingStreak =
    trailingWeek &&
    trailingWeek.filter((x) => x in profile.entries && profile.entries[x].lifted).length >= 3;
  let minWeight = null;
  
  if (profile.entries) {
    for (const date of generateTrailingDates(lastDate, (Object.keys(profile.entries) ?? []).length)) {
      if (!(dateToString(date) in profile.entries)) {
        continue;
      }
      const weight = profile.entries[dateToString(date)].weight;
      if (minWeight === null || weight < minWeight) {
        minWeight = weight;
      }
    }
  }

  const isLow = minWeight === lastWeight;

  if (!profile.active) {
    return <></>;
  }

  return (
    profile.name && (
      <>
        <AddDataModal
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
          profile={profile}
          id={props.id}
          selectedDate={date}
          key={`${props.id}_${date}`}
        />
        <Card
          className="Profile d-inline-block"
        >
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div className="d-flex">
              <div style={{ fontWeight: "500", marginRight: "0.5em" }}>{profile.name}</div>
              <div className="me-2">{weightToLose && <>&mdash;</>}</div>
              {weightToLose && (
                <>
                  {Math.abs(weightDown.toFixed(1))} lbs {weightDown >= 0 ? "lost" : "gained"} in{" "}
                  {daysElapsed} day{daysElapsed !== 1 && "s"}
                </>
              )}
            </div>
            <GrAddCircle className="pointer" onClick={() => {
              setDate(new Date());
              setDialogOpen(true);
            }} />
          </Card.Header>
          <Card.Body className="p-0">
            <div className="chart bg-light">
              <Line
                height={80}
                options={{
                  responsive: true,
                  scales: {
                    x: {
                      type: "time",
                      time: {
                        unit: "day",
                        tooltipFormat: "yyyy-MM-dd",
                      },
                      ticks: {
                        display: false,
                      },
                      grid: {
                        display: true,
                        color: "#eee",
                        drawBorder: true,
                        drawTicks: true,
                      },
                    },
                    y: {
                      ticks: {
                        display: false,
                      },
                      grid: {
                        display: true,
                        color: "#eee",
                        drawBorder: true,
                        drawTicks: true,
                      },
                    },
                  },
                  animation: false,
                  plugins: {
                    legend: null,
                  },
                }}
                data={{
                  labels: [
                    ...dates.map((x) => new Date(`${x[0]}T10:00:00`)),
                    new Date(`${profile.target.date}T10:00:00`),
                  ],
                  datasets: [
                    {
                      data: dates.map((x) => Number(profile.entries[x[0]].weight)),
                      borderColor: "black",
                      backgroundColor: "#aaac",
                      fill: true,
                    },
                    {
                      data: [...dates.map((x) => null), profile.target.weight],
                    },
                  ],
                }}
              />
            </div>
            {dates.length > 0 && (
              <Table className="m-0">
                <thead>
                  <tr>
                    <th>
                      <div
                        style={{ paddingBottom: "3px", fontWeight: "500" }}
                        className="d-flex align-items-center justify-content-center"
                      >
                        <div>Date</div>
                        {onRecordingStreak && <BiCalendarCheck />}
                      </div>
                    </th>
                    <th>
                      <div
                        style={{ paddingBottom: "3px", fontWeight: "500" }}
                        className="d-flex align-items-center justify-content-center"
                      >
                        <div>Weight</div>
                        {isLow ? <GiSmallFire style={{color: "#822"}} /> : onWeightStreak && <BiTrendingDown />}
                      </div>
                    </th>
                    <th>
                      <div
                        style={{ paddingBottom: "3px", fontWeight: "500" }}
                        className="d-flex align-items-center justify-content-center"
                      >
                        <div>Fasted</div>
                        {onFastingStreak && <MdNoFood />}
                      </div>
                    </th>
                    <th>
                      <div
                        style={{ paddingBottom: "3px", fontWeight: "500" }}
                        className="d-flex align-items-center justify-content-center"
                      >
                        <div>Cardio</div>
                        {onCardioStreak && <BiWalk />}
                      </div>
                    </th>
                    <th>
                      <div
                        style={{ paddingBottom: "3px", fontWeight: "500" }}
                        className="d-flex align-items-center justify-content-center"
                      >
                        <div>Lifted</div>
                        {onLiftingStreak && <GiBiceps />}
                      </div>
                    </th>
                    <th>
                      <div
                        style={{ paddingBottom: "3px", fontWeight: "500" }}
                        className="d-flex align-items-center justify-content-center"
                      >
                        <div></div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: "#fafafa" }}>
                    <td>{profile.target.date}</td>
                    <td>{profile.target.weight}</td>
                    <td colSpan={4}>
                      {weightToLose.toFixed(1)} lbs and {daysLeft} days left
                    </td>
                  </tr>
                  {dates.map(([label, date]) => {
                    const entry = profile.entries[dateToString(date)];
                    if (!entry) {
                      return null;
                    }
                    return (
                      <tr key={label}>
                        <td className={entry.blundered && "failure"}>{label}</td>
                        <td>{entry.weight}</td>
                        <td className={entry.fasted ? "success" : "missing"}>
                          {entry.fasted ? <BsCheckCircle /> : <CgClose />}
                        </td>
                        <td className={entry.cardio ? "success" : "missing"}>
                          {entry.cardio ? <BsCheckCircle /> : <CgClose />}
                        </td>
                        <td className={entry.lifted ? "success" : "missing"}>
                          {entry.lifted ? <BsCheckCircle /> : <CgClose />}
                        </td>
                        <td>
                          <BsPencil
                            className="pointer"
                            onClick={() => {
                              setDate(date);
                              setDialogOpen(true);
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </>
    )
  );
}
