import React, { useLayoutEffect, ReactNode, FC, useEffect, ReactElement } from 'react'
import { useState } from 'reinspect'
import Head from 'next/head'
import { AppProps } from 'next/app'
import Router from 'next/router'
import { ThemeProvider, Box } from '@chakra-ui/core'
import { StateInspector } from 'reinspect'
import { CSSReset, Grid, Spinner } from '@chakra-ui/core'
import { Global } from '@emotion/core'
import { useAutoCallback, useAutoMemo, useAutoEffect } from 'hooks.macro'
import { StoreProvider } from 'easy-peasy'
import { useMountedState } from 'react-use'
import { ReactQueryConfigProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query-devtools'

import { theme } from '~/styles/theme'
import { store } from '~/store/store'
import { Layout } from '~/Layout'
import { Login } from '~/modules/login/Login'
import { useStoreState, useStoreActions } from '~/store/store'
import { Stream } from '~/modules/stream/Stream'

export let OT: any, OTSession: any, OTPublisher: any, OTStreams: any, OTSubscriber: any

const Auth: FC = ({ children }) => {
    const isAuth = useStoreState((state) => state.auth.isAuth)
    let PASSWORD = useStoreState((state) => state.auth.PASSWORD)
    let setAuth = useStoreActions((state) => state.auth.setAuth)
    let readStoredPassword = useStoreActions((state) => state.auth.readStoredPassword)

    if (!isAuth) {
        if (readStoredPassword() === PASSWORD) {
            setAuth(true)
        } else {
            return <Login />
        }
    }

    return <>{children}</>
}

function App({ Component, pageProps }: AppProps) {
    console.log('App Render')
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.workbox !== undefined) {
            // add event listeners to handle any of PWA lifecycle event
            // https://developers.google.com/web/tools/workbox/reference-docs/latest/module-workbox-window.Workbox#events
            window.workbox.addEventListener('installed', (event) => {
                console.log(`Event ${event.type} is triggered.`)
                console.log(event)
            })

            window.workbox.addEventListener('controlling', (event) => {
                console.log(`Event ${event.type} is triggered.`)
                console.log(event)
            })

            window.workbox.addEventListener('activated', (event) => {
                console.log(`Event ${event.type} is triggered.`)
                console.log(event)
            })

            // A common UX pattern for progressive web apps is to show a banner when a service worker has updated and waiting to install.
            // NOTE: set skipWaiting to false in next.config.js pwa object
            // https://developers.google.com/web/tools/workbox/guides/advanced-recipes#offer_a_page_reload_for_users
            window.workbox.addEventListener('waiting', (event) => {
                if (confirm('A new version is installed, reload to use the new version immediately?')) {
                    window.workbox.addEventListener('controlling', (event) => {
                        window.location.reload()
                    })
                    window.workbox.messageSW({ type: 'SKIP_WAITING' })
                } else {
                    // User rejected, new verion will be automatically load when user open the app next time.
                }
            })

            // ISSUE - this is not working as expected, why?
            // I could only make message event listenser work when I manually add this listenser into sw.js file
            window.workbox.addEventListener('message', (event) => {
                console.log(`Event ${event.type} is triggered.`)
                console.log(event)
            })

            /*
          window.workbox.addEventListener('redundant', event => {
            console.log(`Event ${event.type} is triggered.`)
            console.log(event)
          })
          window.workbox.addEventListener('externalinstalled', event => {
            console.log(`Event ${event.type} is triggered.`)
            console.log(event)
          })
          window.workbox.addEventListener('externalactivated', event => {
            console.log(`Event ${event.type} is triggered.`)
            console.log(event)
          })
          window.workbox.addEventListener('externalwaiting', event => {
            console.log(`Event ${event.type} is triggered.`)
            console.log(event)
          })
          */

            // never forget to call register as auto register is turned off in next.config.js
            window.workbox.register()
        }
    }, [])
    return (
        <ThemeProvider theme={theme}>
            <ReactQueryConfigProvider config={{ queries: { refetchOnWindowFocus: false } }}>
                {/* <ReactQueryDevtools initialIsOpen={false} /> */}
                <CSSReset />
                <Global
                    styles={{
                        '::-webkit-search-cancel-button': {
                            WebkitAppearance: 'none',
                        },
                        body: {
                            color: 'black',
                            fontSize: '14px',
                            lineHeight: '24px',
                            // display: 'block',
                            margin: 0,
                        },
                        '#__next': {
                            backgroundColor: '#e5e5e5',
                            // display: 'block',
                        },
                    }}
                />
                <StoreProvider store={store}>
                    <StateInspector name='App'>
                        <Head>
                            <meta
                                charSet='utf-8'
                                name='viewport'
                                content='width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no, maximum-scale=1'
                            />

                            <title>Freedom</title>
                            <link
                                href='https://fonts.googleapis.com/css2?family=Roboto&display=swap'
                                rel='stylesheet'
                            />
                            <link
                                href='https://fonts.googleapis.com/css2?family=Yanone+Kaffeesatz&display=swap'
                                rel='stylesheet'
                            />
                        </Head>

                        <Auth>
                            <Box maxW='450px' bg='white'>
                                <Stream />
                                <Component {...pageProps} />
                            </Box>
                        </Auth>
                    </StateInspector>
                </StoreProvider>
            </ReactQueryConfigProvider>
        </ThemeProvider>
    )
}

const LoadNoSSR = ({ children }: { children: ReactElement }) => {
    const [loading, setLoading] = useState(true, 'setLoadingOpenTok')

    useAutoEffect(() => {
        let imp = async () => {
            let module = await import('opentok-react')
            ;({ OTSession, OTPublisher, OTStreams, OTSubscriber } = module)
            OT = await import('@opentok/client')
        }
        imp().then(() => {
            console.log('imported')
            setLoading(false)
        })
    })

    if (loading) {
        return null
    }
    return loading ? <span /> : children
}

const NoSSRComponent = ({ children }: { children: ReactElement }) => {
    return useMountedState() ? children : <span />
}
const NoSSR = (Component: any) => (props: any) => (
    <NoSSRComponent>
        <LoadNoSSR>
            <Component {...props} />
        </LoadNoSSR>
    </NoSSRComponent>
)

export default NoSSR(App)
