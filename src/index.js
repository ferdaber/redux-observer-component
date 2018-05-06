import shallowEqual from 'shallowequal'
import { EventEmitter } from 'eventemitter3'

const ALLOWED_EVENT_TYPES = ['initialize', 'update', 'dispose']

const checkAllowedEventType = event => {
    if (!ALLOWED_EVENT_TYPES.some(e => event === e)) {
        console.warn(`[ReduxComponent] Event type "${event}" is not recognized, it will be ignored`)
    }
}

export class ReduxComponent {
    constructor(store) {
        this.store = store

        this._storeState = store.getState()
        this._stateProps = this.mapStateToProps(this._storeState)
        this._dispatchProps = this.mapDispatchToProps(this.store.dispatch)
        this._ee = new EventEmitter()

        this.props = {
            ...this._stateProps,
            ...this._dispatchProps,
        }

        this._unsubscribe = this.store.subscribe(() => {
            const nextStoreState = this.store.getState()
            if (nextStoreState !== this._storeState) {
                this._storeState = nextStoreState

                const nextStateProps = this.mapStateToProps(this._storeState)
                if (!shallowEqual(this._stateProps, nextStateProps)) {
                    const prevProps = this.props
                    this.props = {
                        ...nextStateProps,
                        ...this._dispatchProps,
                    }
                    this.componentDidUpdate(prevProps)
                    this._ee.emit('update', this.props)
                }
            }
        })

        this.componentDidInitialize()
        this._ee.emit('initialize', this.props)
    }

    dispose() {
        this.componentWillDispose()
        this._unsubscribe()
        this._ee.emit('dispose')
        this._ee.removeAllListeners()
    }

    on(event, cb) {
        checkAllowedEventType(event)
        this._ee.on(event, cb)
        return this
    }

    off(event, cb) {
        checkAllowedEventType(event)
        this._ee.off(event, cb)
        return this
    }

    mapStateToProps(state) {}
    mapDispatchToProps(dispatch) {}
    componentDidInitialize() {}
    componentDidUpdate(prevProps) {}
    componentWillDispose() {}
}

export default ReduxComponent
