A Redux store observer with a familiar React-like API.

*   [Why?](#why)
*   [Why Not?](#why-not)
*   [Usage Case](#usage-case)
*   [API](#api)
    *   [Props Management Methods](#props-management-methods)
        *   [`mapStateToProps`](#mapstatetoprops)
        *   [`mapDispatchToProps`](#mapdispatchtoprops)
    *   [Lifecycle Methods](#lifecycle-methods)
        *   [`componentDidInitialize`](#componentdidinitialize)
        *   [`componentDidUpdate`](#componentdidupdate)
        *   [`componentWillDispose`](#componentwilldispose)
    *   [Instance API](#instance-api)
        *   [`dispose`](#dispose)
        *   [`on`](#on)
*   [Example](#example)

# Why?

When using other libraries with lifecycles that don't match or play well with React, it can often be confusing to try to coerce them into the React component API. This library allows you to control these libraries using a familiar React-like API without the need for React or JSX at all (because often they don't actually render anything). They connect to the same Redux store as your React tree, thus allowing these components and your React tree to interact with each other. Because they do not rely on anything but Redux, the library is entirely agnostic to whichever platform you run it on as long as it runs on Javascript.

# Why Not?

If you are comfortable with custom rendering logic using React, then this is library is unnecessary. Everything that the `ReduxComponent` class provides can be achieved with a React component. Think of `ReduxComponent` as a connected `React.Component` but its `render` method always returns null.

# Usage Case

This component is great for singleton-type modules like logging, usage tracking, feature flagging, and just about anything that only requires a few instances in your app. You can instantiate those components when your app first loads and they will connect to the Redux store, and you can dispatch actions that they will react to from anywhere else in your app, the components themselves can also dispatch their own actions that your app can conversely react to. The below example lists the exact same functionality implemented with redux-component vs. react and react-redux.

```js
// action-logger.js
import ReduxComponent from 'redux-component'

import logger from 'my-apps-logger-api'

export default class ActionLogger extends ReduxComponent {
    mapStateToProps(state) {
        return {
            lastDispatchedAction = state.dispatchedActions[state.dispatchedActions.length - 1]
        }
    }

    componentDidInitialize() {
        logger.initialize()
    }

    componentDidUpdate(prevProps) {
        if (prevProps.lastDispatchedAction !== this.props.lastDispatchedAction) {
            logger.log(this.props.lastDispatchedAction)
        }
    }
}

// app.js
import ActionLogger from './action-logger'
import reduxStore from './my-app-store'

const actionLogger = new ActionLogger(reduxStore)
```

```jsx
// action-logger.js
import React from 'react'
import { connect } from 'react-redux'

import logger from 'my-apps-logger-api'

class ActionLogger extends React.Component {
    componentDidMount() {
        logger.initialize()
    }

    componentDidUpdate(prevProps) {
        if (prevProps.lastDispatchedAction !== this.props.lastDispatchedAction) {
            logger.log(this.props.lastDispatchedAction)
        }
    }

    render() {
        return null
    }
}

const mapStateToProps = state => ({
    lastDispatchedAction = state.dispatchedActions[state.dispatchedActions.length - 1]
})
export default connect(mapStateToProps)(ActionLogger)

// app.js
import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'

import ActionLogger from './action-logger'
import reduxStore from './my-app-store'

const App = () => (
    <Provider store={ reduxStore }>
        <div>
            <ActionLogger />
            <TheRestOfMyApp />
        </div>
    </Provider>
)

render(<App />, document.getElementById('root'))
```

# API

To get started, you can import the component and declare a class that extends from it:

```js
import ReduxComponent from 'redux-component'

class MyComponent extends ReduxComponent {}
```

### Props Management Methods

These optional methods should be defined by you when declaring and implementing the class that extends from `ReduxComponent`, they are called when the component is first initialized and when the Redux store is updated to map the store state to component-specific props.

#### `mapStateToProps`

```ts
function mapStateToProps(state: ReduxStateObject): PartialPropsObject
```

This method receives the Redux store state object and you can return a partial object that will be merged with the return value of `mapDispatchToProps` to create the props object of your component.

#### `mapDispatchToProps`

```ts
function mapDispatchToProps(dispatch: ReduxDispatchFunction): PartialPropsObject
```

This method receives the Redux store `dispatch` method and you can return a partial object that will be merged with the return value of `mapDispatchToProps` to create the props object of your component. You can use this to dispatch actions into the Redux store that other components (even React ones) can react to.

### Lifecycle Methods

These optional methods should be defined by you when declaring and implementing the class that extends from `ReduxComponent`, they are called during the lifecycle of the component as it is initialized and disposed.

#### `componentDidInitialize`

```js
function componentDidInitialize(): void
```

This method is called after the component is initialized and it is connected to the Redux store; you can use this to initiate any side effects like calling an API or initializing a third-party library that you are controlling.

#### `componentDidUpdate`

```js
function componentDidUpdate(props: PropsObject): void
```

This method is called after the Redux store is updated. It will only be called if the previous props result from `mapStateToProps` is different from the current result. A shallow equality check is performed between the two props objects to determine if the component should update.

#### `componentWillDispose`

```js
function componentWillDispose(): void
```

This method is called right after you call `dispose` on the component instance and right before the component is disconnected from the Redux store and all event hooks are disposed; you can use this to clean up any other side effects initiated since the component has mounted.

### Instance API

These methods can be called after the component is initialized to control the lifecycle of the component directly.

#### `dispose`

```ts
function dispose(): void
This method can be called to dispose a component instance and disconnect it from the Redux store.
```

#### `on`

```ts
function on(event: string, cb: EventCallbackFunction): ReduxComponent
```

This method can be called to hook onto component instance lifecycle events from the outside. They are called right after the corresponding lifecycle methods (`componentDidInitialize`, etc...). This method returns the instance itself so multiple event hook attachments can be chained. It supports the following events:

*   `initialize` - the callback receives the instance's props object as the first argument
*   `update` - the callback receives the instance's props object as the first argument
*   `dispose` - the callback does not receive any arguments

# Example

The following example details a small application that controls the lifecycle of a fictional third-party event tracking library, it will control the lifecycle of the library and react to Redux actions dispatched by the React application and call the tracker API accordingly:

```js
/* store.js */

import { createStore } from 'redux'
// action creators
export const trackAction = actionType => ({
    type: 'TRACK_ACTION',
    payload: { actionType },
})
export const trackActionCommit = action => ({
    type: 'TRACK_ACTION_COMMITTED',
    payload: action,
})

// reducer
const initialState = {
    trackedActions: [],
}
const appReducer = (state = initialState, action) => {
    if (action.type === 'TRACK_ACTION') {
        return {
            ...state,
            trackedActions: [...state.trackedActions, action.payload],
        }
    }
    return state
}

export default createStore(appReducer)
```

```js
/* action-tracker.js */

import ReduxComponent from 'redux-component'
import Tracker from 'third-party-tracker'
import { trackActionCommit } from './store'

export default class ActionTracker extends ReduxComponent {
    mapStateToProps(state) {
        // gets the last tracked action from the Redux state so we can submit it to the third-party API
        return {
            lastTrackedAction: state.trackedActions[state.trackedActions.length - 1],
        }
    }

    mapDispatchToProps(dispatch) {
        // when the third-party API finishes tracking the action, we let the store know about it
        return {
            commitTrackedAction: action => dispatch(trackActionCommit(action)),
        }
    }

    componentDidInitialize() {
        // initialize the third-party API
        this.tracker = Tracker.initialize()
    }

    componentDidUpdate(prevProps) {
        // if the last tracked action has changed, then we know we need to submit it to the API
        if (prevProps.lastTrackedAction !== this.props.lastTrackedAction) {
            const actionToTrack = this.props.lastTrackedAction
            this.tracker.trackEvent(actionToTrack.actionType).then(() => this.props.commitTrackedAction(actionToTrack))
        }
    }

    componentWillDispose() {
        // if the component is disposed, dispose the tracker as well to prevent memory leaks
        this.tracker = Tracker.dispose()
    }
}
```

```jsx
/* app.jsx */

import React from 'react'
import { render } from 'react-dom'
import { connect, Provider } from 'react-redux'

import ActionTracker from './action-tracker'
import { trackAction } from './store'
import store from './store'

const actionTracker = new ActionTracker(store)
actionTracker.on('dispose', () => {
    console.log('Tracker is turned off')
})

// when the button in the app is clicked, it will dispatch an action that the action tracker will pick up
const App = props => (
    <div>
        <button onClick={() => props.trackAction('App button clicked')}>Click me</button>
        <button onClick={() => actionTracker.dispose()}>Stop tracking</button>
    </div>
)
const mapDispatchToProps = dispatch => ({
    trackAction: actionType => dispatch(trackAction(actionType)),
})
const ConnectedApp = connect(null, mapDispatchToProps)(App)

render(
    <Provider store={store}>
        <ConnectedApp />
    </Provider>,
    document.getElementById('root')
)
```
