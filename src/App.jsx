import React, { Component, Fragment } from "react";
import { Row, Col } from "reactstrap";
import logo from "./assets/logo1.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserCheck,
  faCalendarCheck,
  faAngleRight
} from "@fortawesome/free-solid-svg-icons";
import { Calendar } from "@fullcalendar/core";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import esLocale from "@fullcalendar/core/locales/es";
import swal from "sweetalert";
import $ from "jquery";
import "@fullcalendar/core/main.css";
import "@fullcalendar/daygrid/main.css";
import "animate.css/animate.css";
import "./App.css";

class App extends Component {
  state = {
    step_no: "1. - ",
    step_cont: "Elige el día de tu visita.",
    today: new Date(),
    loading: true,
    dating: {
      date: "",
      name: "",
      tel: "",
      email: "",
      age: "",
      city: ""
    },
    un_dates: []
  };
  componentDidMount() {
    const that = this;
    fetch("https://webservicesnt.org:4443/kidzania", {
      method: "POST",
      body: JSON.stringify({ type: "get" }),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(res => res.json())
      .then(result => {
        if (result.result === 1) {
          for (let index = 0; index < result.data.length; index++) {
            result.data[index]["title"] = "No disponible";
            result.data[index]["editable"] = false;
            result.data[index]["classNames"] = ["unable-date"];
          }
          this.setState({
            loading: false,
            un_dates: result.data
          });
          var calendarEl = document.getElementById("calendar-cont");
          var calendar = new Calendar(calendarEl, {
            plugins: [dayGridPlugin, interactionPlugin],
            locale: esLocale,
            header: {
              left: "",
              center: "title",
              right: "today prev,next"
            },
            events: this.state.un_dates,
            validRange: {
              start: this.formatDate(this.state.today)
            },
            defaultView:
              $(window).width() < 765 ? "dayGridWeek" : "dayGridMonth",
            selectable: true,
            droppable: true,
            dateClick: function(info) {
              let valid = true;
              for (let i = 0; i < that.state.un_dates.length; i++) {
                console.log(that.state.un_dates[i]);
                if (info.dateStr === that.state.un_dates[i].start) {
                  valid = false;
                  return 0;
                }
              }
              if (valid) {
                let dating = that.state.dating;
                //if (dating.date != "") {
                //  $("[data-date='" + dating.date + "']").removeClass(
                //    "fc-highlight"
                //  );
                //}
                dating.date = info.dateStr;
                that.setState({ dating: dating });
                //$("[data-date='" + dating.date + "']").addClass("fc-highlight");
                let event = calendar.getEventById("myvisit");
                if (event != null) {
                  event.remove();
                }
                calendar.addEvent({
                  id: "myvisit",
                  title: "Mi visita",
                  start: info.dateStr,
                  classNames: ["selected-date"],
                  allDay: true
                });
              }
            }
          });
          calendar.render();
        } else {
          swal({
            title: "¡Lo sentimos!",
            text:
              "Ha ocurrido un error al cargar las fechas, porfavor reintenta",
            icon: "error"
          }).then(function() {
            window.location.reload();
          });
        }
      });
  }
  animateStep = n => {
    window.scrollTo(0, 0);
    $(".stepper-rad:eq(" + (n - 1) + ")").addClass("completed-step");
    let old_el = $(".body-cont:eq(" + (n - 1) + ")");
    let new_el = $(".body-cont:eq(" + n + ")");
    setTimeout(function() {
      old_el.css("display", "none");
      new_el.css("display", "block");
      new_el.css("opacity", 1);
    }, 500);
    old_el.css("opacity", 0);
    new_el.css("opacity", 0);
  };
  reverseStep = n => {
    let new_el = $(".body-cont:eq(" + (n - 1) + ")");
    let old_el = $(".body-cont:eq(" + n + ")");
    setTimeout(function() {
      old_el.css("display", "none");
      new_el.css("display", "block");
      new_el.css("opacity", 1);
      window.scrollTo(0, 0);
      $(".stepper-rad:eq(" + (n - 1) + ")").removeClass("completed-step");
    }, 500);
    old_el.css("opacity", 0);
    new_el.css("opacity", 0);
    this.setState({
      step_no: "1. - ",
      step_cont: "Elige el día de tu visita."
    });
  };
  changeStep = (curr_step, e) => {
    e.preventDefault();
    const that = this;
    switch (curr_step) {
      case 1:
        if (this.state.dating.date === "") {
          swal({
            title: "¡Espera!",
            text: "Olvidaste seleccionar una fecha",
            icon: "warning"
          });
        } else {
          this.setState({
            step_no: "2. - ",
            step_cont: "Cuéntanos un poco sobre ti."
          });
          this.animateStep(curr_step);
        }
        break;
      case 2:
        this.setState({ loading: true });
        $(".stepper-rad:eq(" + (curr_step - 1) + ")").addClass(
          "completed-step"
        );
        this.getFormData($("#kz-form"));
        setTimeout(function() {
          fetch("https://webservicesnt.org:4443/kidzania", {
            method: "POST",
            body: JSON.stringify({ type: "insert", data: that.state.dating }),
            headers: {
              "Content-Type": "application/json"
            }
          })
            .then(res => res.json())
            .then(result => {
              if (result.result === 1) {
                swal({
                  title: "¡Excelente!",
                  text: "Tu cita ha sido registrada correctamente",
                  icon: "success"
                }).then(function() {
                  window.location.reload();
                });
              } else {
                swal({
                  title: "¡Lo sentimos!",
                  text:
                    "Ha ocurrido un error durante el registro, porfavor reintenta",
                  icon: "error"
                }).then(function() {
                  $(".stepper-rad:eq(" + (curr_step - 1) + ")").removeClass(
                    "completed-step"
                  );
                  that.setState({ loading: false });
                });
              }
            });
        }, 500);
        break;
      default:
        break;
    }
  };
  getFormData = form => {
    var unindexed_array = form.serializeArray();
    var indexed_array = this.state.dating;
    $.map(unindexed_array, function(n, i) {
      indexed_array[n["name"]] = n["value"];
    });
    this.setState({ dating: indexed_array });
  };
  formatDate = date => {
    var d = date,
      month = "" + (d.getMonth() + 1),
      day = "" + d.getDate(),
      year = d.getFullYear();
    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    return [year, month, day].join("-");
  };
  render() {
    return (
      <>
        <Row className="nav">
          <Col xs="12">
            <Row>
              <Col xs="3" sm="3" md="2" lg="1">
                <img className="kz-nav-logo" src={logo} />
              </Col>
              <Col xs="9" sm="9" md="10" lg="11">
                <span className="nav-item">Agendar mi visita</span>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row>
          <Col xs="12" lg={{ size: 10, offset: 1 }}>
            <p className="date-title">
              Completa los siguientes pasos y reserva tu lugar ¡Ahora!
            </p>
            <div className="stepper-cont">
              <div className="stepper-line" />
              <div className="stepper-step">
                <div className="stepper-rad">
                  <FontAwesomeIcon icon={faCalendarCheck} />
                </div>
              </div>
              <div className="stepper-step">
                <div className="stepper-rad">
                  <FontAwesomeIcon icon={faUserCheck} />
                </div>
              </div>
            </div>
            {!this.state.loading && (
              <Fragment>
                <p className="date-subtitle">
                  {this.state.step_no}
                  <span className="date-content">{this.state.step_cont}</span>
                </p>
                <div className="bodies-cont">
                  <div className="body-cont">
                    <div id="calendar-cont" />
                    <Row className="row-div">
                      <Col xs="12" className="row-div-r">
                        <button
                          className="kz-btn"
                          onClick={e => this.changeStep(1, e)}
                        >
                          Continuar <FontAwesomeIcon icon={faAngleRight} />
                        </button>
                      </Col>
                    </Row>
                  </div>
                  <div className="body-cont">
                    <form id="kz-form" onSubmit={e => this.changeStep(2, e)}>
                      <Row>
                        <Col sm="12" className="form-row">
                          <label className="kz-label" htmlFor="name">
                            ¿Cuál es tu nombre?
                            <span className="required-field">*</span>
                          </label>
                          <input
                            className="kz-input"
                            type="text"
                            pattern="([A-z0-9À-ž\s]){2,30}"
                            name="name"
                            required
                          />
                        </Col>
                      </Row>
                      <Row>
                        <Col sm="12" lg="6" className="form-row">
                          <label className="kz-label" htmlFor="age">
                            ¿Cuántos años tienes?
                            <span className="required-field">*</span>
                          </label>
                          <input
                            className="kz-input"
                            type="number"
                            max="99"
                            min="1"
                            name="age"
                            required
                          />
                        </Col>
                        <Col sm="12" lg="6" className="form-row">
                          <label className="kz-label" htmlFor="city">
                            ¿En qué ciudad te encuentras?
                            <span className="required-field">*</span>
                          </label>
                          <input
                            className="kz-input"
                            type="text"
                            maxLength="50"
                            pattern="([A-z0-9À-ž\s]){2,30}"
                            name="city"
                            required
                          />
                        </Col>
                      </Row>
                      <Row>
                        <Col sm="12" className="form-row">
                          <label className="kz-label" htmlFor="email">
                            ¿Cuál es tu correo electrónico
                            <span className="required-field">*</span>
                          </label>
                          <input
                            className="kz-input"
                            type="email"
                            name="email"
                            required
                          />
                        </Col>
                      </Row>
                      <Row>
                        <Col sm="12" className="form-row">
                          <label className="kz-label" htmlFor="tel">
                            ¿Cuál es tu número telefónico?
                            <span className="required-field">*</span>
                          </label>
                          <input
                            className="kz-input"
                            type="tel"
                            pattern="[0-9 -]{9,15}"
                            name="tel"
                            required
                          />
                        </Col>
                      </Row>
                      <Row>
                        <Col sm="12" className="form-row">
                          <label className="kz-label" htmlFor="comment">
                            Déjanos algún comentario adicional
                          </label>
                          <textarea
                            className="kz-input"
                            type="text"
                            name="comment"
                            maxLength="250"
                            rows="3"
                            placeholder="Escribe aquí lo que quieras"
                          />
                        </Col>
                      </Row>
                      <Row className="row-div">
                        <Col xs="6" className="row-div-l">
                          <button
                            className="kz-btn"
                            onClick={e => this.reverseStep(1)}
                          >
                            Volver
                          </button>
                        </Col>
                        <Col xs="6" className="row-div-r">
                          <button className="kz-btn" type="submit">
                            Continuar <FontAwesomeIcon icon={faAngleRight} />
                          </button>
                        </Col>
                      </Row>
                    </form>
                  </div>
                </div>
              </Fragment>
            )}
            {this.state.loading && (
              <div class="lds-roller">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            )}
          </Col>
        </Row>
      </>
    );
  }
}

export default App;
