import React from 'react'

const LingostContext = React.createContext()
const defaultState = { __exists: false }
const state = new Proxy(defaultState, {
    get(target, key) {
        if (key !== '__exists' && key !== 'toJSON') {
            if(target[key] === undefined) {
                target[key] = createInfiniteObjectProxy({})
                target.__exists = true
            }
        }
        return target[key]
    },
    set(target, key, value){
        if (key !== '__exists' && key !== 'toJSON') {
            target.__exists = true
            target[key] = value
        }
    }
});

const connectComponentList = []
const componentWrapperFunctions = []
const setStateByNames = {}

let usedKeys = {}

const createInfiniteObjectProxy = (defaultState) => {
	if (Object.keys(defaultState).length > 0) {
		defaultState.__exists = true
    }else{
		defaultState.__exists = false
    }
    return new Proxy(defaultState, {
        get(target, key) {
			if (key !== '__exists' && key !== 'toJSON') {
                if(target[key] === undefined) {
                    target[key] = createInfiniteObjectProxy({})
                    target.__exists = true
                }
            }
            return target[key]
        },
        set(target, key, value){
			if (key !== '__exists' && key !== 'toJSON') {
                target.__exists = true
                target[key] = value
            }
        },
    })
}
const defaultStateToInfiniteProxy = (defaultState) => {
    for (let defaultStateIdx in defaultState) {
        if (!!defaultState[defaultStateIdx] && ['Object','Array'].indexOf(defaultState[defaultStateIdx].constructor.name) != -1) {
            defaultStateToInfiniteProxy(defaultState[defaultStateIdx])
            defaultState[defaultStateIdx] = createInfiniteObjectProxy(defaultState[defaultStateIdx])
        }
    }
}

function _createState(stateName, defaultState = {}){

    defaultState.__exists = Object.keys(defaultState).filter(k=>k!=='__exists').length > 0
    defaultStateToInfiniteProxy(defaultState)
    let proxyObject = new Proxy(defaultState, {
        get(target, key) {
            if (key !== '__exists' && key !== 'toJSON') {
                if(target[key] === undefined) {
                    target[key] = createInfiniteObjectProxy({})
                }
                if(!usedKeys[stateName]) usedKeys[stateName] = []
                usedKeys[stateName].push(key)
            }else{
                return !!target[key]
            }
            return target[key]
        },
        set(target, key, value){
            if (key !== '__exists' && key !== 'toJSON') {
                if (!!value && value.constructor.name === 'Object') {
                    target[key] = createInfiniteObjectProxy(value)
                }else{
                    target[key] = value
                }
            }
        },
    });

    const setState = ( newState ) => {
        let updatedKeys = {}
        for (let newKey in newState) {
            proxyObject[newKey] = newState[newKey]
            updatedKeys[newKey] = true
        }
        for (let connected of connectComponentList) {
            if ( !connected ) {
                continue
            }
            if ( connected.stateNames[stateName] ) {
                for (let connectedKey of connected.stateNames[stateName]){
                    if ( updatedKeys[connectedKey] ){
                        connected.component.reRenderByState()
                        break
                    }
                }
            }
        }
        return createdState
    }

    setStateByNames[stateName] = setState

    state[stateName] = proxyObject
    
    let createdState = {
        setState,
        notReRenderedInRealtimeState: proxyObject
    }
    
    return createdState
}

function _passStateToProps(fn = (state: Object, setStateByName = (name: String, newState: Object) => {}) => {}) {
    const setStateByName = (name, newState) => {
        if ( setStateByNames[name] ) {
            setStateByNames[name]( newState )
        }
    }
    fn = typeof fn == 'function' ? fn : () => ({})
    return function(ToConnectComponent: React.Component){
        for (let componentWrapperFunction of componentWrapperFunctions) {
            try{
                ToConnectComponent = componentWrapperFunction(ToConnectComponent)
            }catch(e){
                throw new Error(componentWrapperFunction ? componentWrapperFunction.toString() : e.toString())
            }
        }
        class Connect extends React.Component{
            constructor(p){
                super(p)

                this.connectComponentListIdx = connectComponentList.push({ component: this, stateNames:{} }) - 1
                this.state = this.getProps()
            }
            getProps = () => {
                usedKeys = {}
                let props = fn(state, setStateByName) || {}
                if (connectComponentList[this.connectComponentListIdx]) {
                    let stateNames = connectComponentList[this.connectComponentListIdx].stateNames
                    for (let usedKey in usedKeys) {
                        if ( !stateNames[usedKey] ) stateNames[usedKey] = []
                        stateNames[usedKey] = [ ...stateNames[usedKey], ...usedKeys[usedKey] ]
                        stateNames[usedKey] = stateNames[usedKey].filter((n,i)=>stateNames[usedKey].indexOf(n) == i)
                    }
                }
                
                return props
            }
            isChanged = function (now, target) {
                let changed = false
                for (let key in now) {
                    if (now[key] != null && typeof now[key] == 'object') {
                        changed = typeof target[key] == 'object' ? this.isChanged(now[key], target[key]) : true
                    } else {
                        changed = now[key] !== target[key]
                    }

                    if (changed){
                        return changed
                    }
                }
                return changed
            }
            reRenderByState = () => {

                let nowState = this.state
                let nextState = this.getProps()
                
                let changed = false
                try{
                    changed = JSON.stringify(nowState) != JSON.stringify(nextState)
                }catch(e){
                    changed = this.isChanged(nowState, nextState) || this.isChanged(nextState, nowState)
                }
                if (changed) {
                    this.forceRender = true
                    this.setState(nextState)
                }
            }
            shouldComponentUpdate(nextProps){
                if ( this.forceRender ) {
                    this.forceRender = false
                    return true
                }else{
                    let changed = false
                    try{
                        changed = JSON.stringify(this.props) != JSON.stringify(nextProps)
                    }catch(e){
                        for (let propsKey of Object.keys(this.props)) {
                            if (propsKey == 'children') continue;
                            if (this.props[propsKey] !== nextProps[propsKey]) {
                                changed = true
                                break
                            }
                        }
                    }
                    return changed
                }
            }
            componentWillUnmount(){
                connectComponentList[this.connectComponentListIdx] = null
            }
            render(){
                return (<ToConnectComponent {...this.state} {...this.props}/>)
            }
        }

        return Connect
    }
}
function _useMiddleware( componentWrapperFunction: React = (component) => {} ){
    componentWrapperFunctions.push(componentWrapperFunction)
}


export const useMiddleware = _useMiddleware
export const createState = _createState
export const passStateToProps = _passStateToProps
export default { useMiddleware, createState, passStateToProps }