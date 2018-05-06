import { Store, Dispatch as DispatchAction } from 'redux'

export type Dispatch = DispatchAction<any>

interface EventHandlers<P = {}> {
    initialize(props: P): void
    update(props: P): void
    dispose(): void
}

export interface ReduxComponentLifeycle<S = {}, P = {}> {
    mapStateToProps?(state: S): Partial<P> | null
    mapDispatchToProps?(dispatch: Dispatch): Partial<P> | null
    componentDidInitialize?(): void
    componentDidUpdate?(prevProps: P): void
    componentWillDispose?(): void
}

export interface ReduxComponent<S = {}, P = {}> extends ReduxComponentLifeycle<S, P> {}
export class ReduxComponent<S = {}, P = {}> {
    store: Store<S>
    props: P

    dispose(): void
    on<E extends keyof EventHandlers<P>>(event: E, cb: EventHandlers<P>[E]): this
    off<E extends keyof EventHandlers<P>>(event: E, cb?: EventHandlers<P>[E]): this
}

export default ReduxComponent
