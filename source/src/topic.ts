import { BotContext, Promiseable } from 'botbuilder';

// Topic - Abstract base class for modeling a topic of conversation.
//  S = Interface for the state of the Topic, used to manage the Topic on each turn, 
//      or call to onReceive().
//  V = Interface for the resulting value for when the Topic completes successfully.
//      Optional for cases where the Topic doesn't need to return a value. 
export abstract class Topic<BTC extends BotContext, S, V = any> {

    constructor(state: S) {
        this._state = state;
        return this;
    }

    // state - Property to get state of Topic for persisting between turns.
    private _state: S;
    public get state(): S {
        return this._state;
    }
    public set state(state: S) {
        this._state = state;
    }

    // onReceive - Called on each turn when Topic is the active topic of conversation.
    abstract onReceive(context: BTC): Promiseable<any>;

    // onSuccess - Function to call when the Topic completes successfully, passing the
    //  resulting value of the Topic.
    protected _onSuccess?: (context: BTC, value: V) => void = () => {};
    public onSuccess(success: (context: BTC, value: V) => void) {
        this._onSuccess = success;
        return this;
    }

    // onFailure - Function to call when the Topic ends unsuccessfully, passing the reason
    //  why the Topic failed. 
    protected _onFailure?: (context: BTC, reason: string) => void = () => {};
    public onFailure(failure: (context: BTC, reason: string) => void) {
        this._onFailure = failure;
        return this;
    }
}