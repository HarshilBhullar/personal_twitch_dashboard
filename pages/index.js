// Main entry point of your app
import React, { useEffect, useState } from "react"
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import StreamerGrid from '../components/StreamerGrid'

const Home = () => {
  // State
  const [favChannels, setFavChannels] = useState([])
  // prevent the page from redirecting

  useEffect(() => {
    console.log("Fetching Channels...")
    fetchChannels()
  }, [])

  const addChannel = async event => {
    event.preventDefault()

    const { value } = event.target.elements.name
    if(value) {
        console.log("value: ", value)

        // call Twitch Search API
        const path = `https://${window.location.hostname}`

        const response = await fetch(`${path}/api/twitch`, {
          method: 'POST',
          headers: {
            'Content-type': 'application/json'
          },
          body: JSON.stringify({ data: value })
        })
        
        const json = await response.json()
        
        setFavChannels(prevState => [...prevState, json.data])

        // set channelName string in DB
        await setChannel(value)

        event.target.elements.name.value = ""
    }
  }

  const setChannel = async channelName => {
    try {
      // get all current streamer names in list
      const currentStreamers = favChannels.map(channel => channel.display_name.toLowerCase())

      const streamerList = [...currentStreamers, channelName].join(",")

      const path = `https://${window.location.hostname}`

      const response = await fetch(`${path}/api/database`, {
        method: 'POST',
        body: JSON.stringify({
          key: 'CHANNELS',
          value: streamerList
        })
      })

      if (response.status === 200) {
        console.log(`Set ${channelName} in DB`)
      }
    } catch (error) {
      console.warn(error.message)
    }
  }

  const fetchChannels = async() => {
    try{
      const path = `https://${window.location.hostname}`

      // get keys from DB
      const response = await fetch('${path}/api/database', {
        method: 'POST',
        body: JSON.stringify({
          action: 'GET_CHANNELS',
          key: 'CHANNELS'
        })
      })

      if(response.status === 404) {
        console.log('Channels key could not be found')
      }

      const json = await response.json()

      if(json.data) {

        const channelNames = json.data.split(',')

        console.log('CHANNEL NAMES: ', channelNames)

        // get twitch data and sset in channels State
        const channelData = []

        for await(const channelName of channelNames) {
          console.log("Getting Twitch data for: ", channelName)

          const channelResp = await fetch(`${path}/api/twitch`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data: channelName })
          })

          const json = await channelResp.json()

          if(json.data) {
            channelData.push(json.data)
            console.log(channelData)
          }
        }

        setFavChannels(channelData)
      }
    } catch (error) {
      console.warn(error.message)
    }
  }

  

  const renderForm = () => (
    <div className={styles.formContainer}>
      <form onSubmit={addChannel}>
        <input id="name" placeholder="Twitch Channel Name" type="text" required />
        <button type="submit">Add Streamer</button>
      </form>
    </div>
  )

  return (
    <div className={styles.container}>
      <Head>
        <title>🎥 Personal Twitch Dashboard</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <div className={styles.inputContainer}>
        {renderForm()}
        <StreamerGrid channels={favChannels} setChannels={setFavChannels}/>
      </div>
    </div>
  )
}

export default Home