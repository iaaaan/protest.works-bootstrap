// var restify = require('restify');
// var server = restify.createServer();
// var activity = []

// function cleanActivity () {
//   activity = activity.slice(0, 1000000)
//   var now = Math.floor(Date.now() / 1000);
//   var i = activity.length
//   while(i-- > 0) {
//     if (activity[i][0] < now - 10) activity.pop()
//   }
// }
// setInterval(cleanActivity, 1000);

// server.get('/hit', function(req, res, next) {
//   var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
//   var now = Math.floor(Date.now() / 1000);
//   var hit = [now, ip];
//   activity.unshift(hit)
//   res.json({'status': 'success'});
// });

// server.get('/activity', function(req, res, next) {
//   res.json({'activity': activity})
// });

// server.listen(8080, function() {
//   console.log('%s listening at %s', server.name, server.url);
// });

//

const PeerId = require('peer-id')
const PeerInfo = require('peer-info')
const Node = require('libp2p-ipfs-nodejs')
const multiaddr = require('multiaddr')
const pull = require('pull-stream')
// const toPull = require('stream-to-pull-stream')
const async = require('async')
const Pushable = require('pull-pushable')
const p = Pushable()
// let idListener

// 10322-10539
const port = process.argv[2]
const peerBook = {}


PeerId.create({ bits: 1024 }, (err, id) => {
  console.log('multiaddr:')
  console.log(JSON.stringify(id.toJSON(), null, 2))

  const peer = new PeerInfo(id)
  peer.multiaddr.add(multiaddr('/ip4/127.0.0.1/tcp/' + port))
  const node = new Node(peer)

  node.start((err) => {
    if (err) {
      throw err
    }

    node.swarm.on('peer-mux-established', (peerInfo) => {
      const id = peerInfo.id.toB58String()
      console.log('peer-mux-established: ', id)
      peerBook[id] = peerInfo
    })

    node.handle('/chat/1.0.0', (protocol, conn) => {
      console.log('handling chat')
      // send
      pull(
        // pull.values([1,2,3,5]),
        // conn
        p,
        conn
      )

      //receive
      pull(
        conn,
        pull.map((data) => {
          return data.toString('utf8').replace('\n', '')
        }),
        pull.drain((data) => {
          switch (data) {
            case 'relays' : {
              p.push(JSON.stringify(peerBook))
              break
            }
            default : {
              // p.push('nothing')
              console.log(data)
            }
          }
        })
      )

      // process.stdin.setEncoding('utf8')
      // process.openStdin().on('data', (chunk) => {
      //   var data = chunk.toString()
        
      // })
    })

    console.log('Listener ready, listening on:')
    peer.multiaddrs.forEach((ma) => {
      console.log(ma.toString())
      // console.log(ma.toString() + '   /ipfs/' + idListener.toB58String())
    })
  })

})


// async.parallel([
//   (callback) => {
//     PeerId.createFromJSON(require('./peer-id-dialer'), (err, idDialer) => {
//       if (err) {
//         throw err
//       }
//       callback(null, idDialer)
//     })
//   },
//   (callback) => {
//     PeerId.createFromJSON(require('./peer-id-listener'), (err, idListener) => {
//       if (err) {
//         throw err
//       }
//       callback(null, idListener)
//     })
//   }
// ], (err, ids) => {
//   if (err) throw err
//   const peerDialer = new PeerInfo(ids[0])
//   peerDialer.multiaddr.add(multiaddr('/ip4/0.0.0.0/tcp/0'))
//   const nodeDialer = new Node(peerDialer)

//   const peerListener = new PeerInfo(ids[1])
//   idListener = ids[1]
//   peerListener.multiaddr.add(multiaddr('/ip4/127.0.0.1/tcp/10333'))
//   nodeDialer.start((err) => {
//     if (err) {
//       throw err
//     }

//     console.log('Dialer ready, listening on:')

//     peerListener.multiaddrs.forEach((ma) => {
//       console.log(ma.toString() + '/ipfs/' + idListener.toB58String())
//     })

//     nodeDialer.dialByPeerInfo(peerListener, '/chat/1.0.0', (err, conn) => {
//       if (err) {
//         throw err
//       }
//       console.log('nodeA dialed to nodeB on protocol: /chat/1.0.0')
//       console.log('Type a message and see what happens')
//       // Write operation. Data sent as a buffer
//       pull(
//         p,
//         conn
//       )
//       // Sink, data converted from buffer to utf8 string
//       pull(
//         conn,
//         pull.map((data) => {
//           return data.toString('utf8').replace('\n', '')
//         }),
//         pull.drain(console.log)
//       )

//       process.stdin.setEncoding('utf8')
//       process.openStdin().on('data', (chunk) => {
//         var data = chunk.toString()
//         p.push(data)
//       })
//     })
//   })
// })