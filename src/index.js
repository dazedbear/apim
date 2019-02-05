import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import SwaggerUI from 'swagger-ui';
import "swagger-ui/dist/swagger-ui.css";
import './index.scss';
import * as serviceWorker from './serviceWorker';


class App extends Component {
  componentDidMount = () => {    
    SwaggerUI({
      dom_id: '#swagger-ui',
      url: `${process.env.REACT_APP_SITE_URL}/swagger.yaml`
    })
  }
  
  render() {
    return (
      <div id="swagger-ui" />
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
