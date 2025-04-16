/*
You are using a BETA build of PurpleCart Designer- bugs are expected and features will be missing

PurpleCart Designer is property of OttersMeep
Do not share, reupload, distribute, or otherwise disseminate this script without prior permission (contact me @ottersmeep on Discord)

Created by OttersMeep for PurpleTrain
minecartrapidtransit.net
v0.1b
*/
let button
let addTextureTC
let textureForm
let getTextureName

function translate(from1, to1, origin1, rotation1) {
    from = new THREE.Vector3(from1[0], from1[1], from1[2])
    to = new THREE.Vector3(to1[0], to1[1], to1[2])
    origin = new THREE.Vector3(origin1[0], origin1[1], origin1[2])
    rotationDeg = new THREE.Euler(
        THREE.MathUtils.degToRad(rotation1[0]),
        THREE.MathUtils.degToRad(rotation1[1]),
        THREE.MathUtils.degToRad(rotation1[2])
    )

    // Step 1: Compute real center of cube
    realCenter = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5)

    // Step 2: Offset from pivot to real center
    offset = new THREE.Vector3().subVectors(realCenter, origin)

    // Step 3: Apply rotation to offset
    rotationQuat = new THREE.Quaternion().setFromEuler(rotationDeg)
    rotatedOffset = offset.clone().applyQuaternion(rotationQuat)

    // Step 4: Compute adjusted center (as if rotating around own center)
    adjustedCenter = new THREE.Vector3().addVectors(origin, rotatedOffset)

    return (adjustedCenter)
}

function selectedCubeTextureName() {
    console.log("Debug purposes ONLY")
    console.log(Blockbench.Cube.all)
}
function getTextureNameFromUUID(inputUUID) {
    for (let i = 0; i < Texture.all.length; i++) {
        if (Texture.all[i].uuid == inputUUID) {
            textureName = Texture.all[i].name.replace(/\.[^/.]+$/, "")
        }
    }
    textureName = textureName.replace(/^[^:]*:/, "").toUpperCase()
    return textureName

}

function post(data) {
    Blockbench.showQuickMessage("Uploading to the TrainCarts pastebin- this behavior can be toggled off in settings")
    headers = new Headers()
    headers.append("Content-Type", "text/plain")

    raw = data

    requestOptions = {
        method: "POST",
        headers: headers,
        body: raw,
        redirect: "follow"
    }

    fetch("https://paste.traincarts.net/documents", requestOptions)
        .then((response) => response.text())
        .then((result) => paste(result))
        .catch((error) => console.error(error))
}

function paste(data) {
    const key = JSON.parse(data).key
    const url = `https://paste.traincarts.net/${key}`

    // Copy to clipboard
    navigator.clipboard.writeText(url)

    // Create dialog content with an embedded image
    const content = `
        <div style="text-align:center")>
            <img src="https://i.postimg.cc/6pj3g30W/nQ6wDjl.png" alt="TrainCarts" style="max-width: 100%; height: auto; margin-top: 10px;" />
            <p>Your model has been uploaded to <br><a href="${url}" target="_blank">${url}</a></p><p>and the link has been copied to your clipboard</p><br>
            <p style="margin-top:10px">Plugin by @OttersMeep for <a href="https://discord.com/invite/HXF5uMVuMP">PurpleTrain Ltd.</a><br><br>
            TrainCarts is developed by BergerHealer completely independently of this project.</p>
        </div>
    `

    // Show a custom HTML dialog
    new Dialog({
        id: 'paste_upload_dialog',
        title: 'Export Finished',
        lines: [content],
        width: 800,
        buttons: ['Close']
    }).show()
}


function multiplyMatrices(A, B) {
    rowsA = A.length
    colsA = A[0].length
    rowsB = B.length
    colsB = B[0].length

    if (colsA !== rowsB) {
        throw new Error("Matrix dimensions do not match for multiplication")
    }

    result = Array.from({ length: rowsA }, () => Array(colsB).fill(0))

    for (let i = 0; i < rowsA; i++) {
        for (let j = 0; j < colsB; j++) {
            for (let k = 0; k < colsA; k++) {
                result[i][j] += A[i][k] * B[k][j]
            }
        }
    }

    return result
}


function addTexture(text) {
    data = { name: text }
    texture = new Texture(data)
    texture.edit()
    texture.add()
}
Plugin.register('purplecart_designer', {
    title: 'PurpleCart Designer',
    author: 'OttersMeep',
    about: `Enables export of Blockbench models to Traincarts format \n \n Created by OttersMeep for the Minecart Rapid Transit Server \n \n :3 \n \n \n \n Upcoming features include: \n \n Collision Support \n \n Seat Support \n \n Native Blockbench animation support`,
    description: `Enables the creation of TC attachment trains through Blockbench`,
    icon: 'train',
    version: '0.1b',
    variant: 'both',
    onload() {
        getTextureName = new Action('get_texture_name', {
            name: 'Get texture name',
            description: 'DEBUG',
            icon: 'feature_search',
            click: function () {
                selectedCubeTextureName()
            }
        })
        addTextureTC = new Action('add_texture', {
            name: 'New TC compliant texture',
            description: 'Add a texture',
            icon: 'texture-add',
            click: function () {
                promptTexture()
            }
        })
        button = new Action('export', {
            name: 'Export to Traincarts',
            description: 'Uploads to the Traincarts pastebin',
            icon: 'save',
            click: function () {
                //Code for clicking button
                exportProject()

            }
        })
        MenuBar.addAction(button, 'filter')
        console.log(`You are using a BETA build of PurpleCart Designer- bugs are expected and features will be missing

PurpleCart Designer is property of OttersMeep and PTM Industries
Do not share, reupload, distribute, or otherwise disseminate this script without prior permission (contact me: @ottersmeep on Discord and PTM Industries in the PurpleTrain Ltd. Discord server: https://discord.gg/HXF5uMVuMP)

Created by OttersMeep for PurpleTrain
minecartrapidtransit.net
v0.1b`)
    },
    onunload() {
        button.delete()
    }
})

function exportProject() {
    var cubes = Blockbench.Cube.all
    let doubleSpace = `  `
    let quadrupleSpace = `    `
    let quadLine = `\n    `
    let sixLine = quadLine + doubleSpace
    let newLine = `\n`
    var data = `type: EMPTY
entityType: MINECART
attachments:`
    for (let i = 0; i < cubes.length; i++) {
        var textureName = getTextureNameFromUUID(cubes[i].faces.down.texture)
        var newCube = convertCube(cubes[i])
        data = data + `\n  ${i}:
    type: ITEM
    item:
      ==: org.bukkit.inventory.ItemStack
      v: 4189
      type: ${textureName}
    position:
      transform: DISPLAY_HEAD
      posX: ${newCube.PosX}
      posY: ${newCube.PosY}
      posZ: ${newCube.PosZ}
      rotX: ${newCube.RotX}
      rotY: ${newCube.RotY}
      rotZ: ${newCube.RotZ}
      sizeX: ${newCube.sizeX}
      sizeY: ${newCube.sizeY}
      sizeZ: ${newCube.sizeZ}`
    }
    data = data + `\neditor:
  selectedIndex: 0\nposition: {}`
  post(data)
}

function convertCube(cube) {
    PosOriginal = [cube.from[0] + cube.to[0] / 2, cube.from[0] + cube.to[0] / 2, cube.from[0] + cube.to[0] / 2]
    Rot = cube.rotation
    Pos = translate(cube.from, cube.to, cube.origin, cube.rotation)
    var newCube = {
        PosX: Pos.x,
        PosY: Pos.z,
        PosZ: Pos.y,
        RotX: Rot[0],
        RotY: Rot[1],
        RotZ: Rot[2],
        sizeX: Math.abs(cube.from[0] - cube.to[0]),
        sizeY: Math.abs(cube.from[1] - cube.to[1]),
        sizeZ: Math.abs(cube.from[2] - cube.to[2]),
        type: "cube v1"
    }
    return newCube
}


function convertRotation(PosX, PosY, PivX, PivY, RotX, RotY) {
    newDegreeFacingCenter = Math.asin((PosX - PivX) / Math.sqrt(Math.pow((PosX - PivX), 2) + Math.pow((PosX - PivX), 2))) / (Math.PI / 180)
}


function findCubeByUUID(inputUUID) {
    var cubes = Project.elements
    for (let i = 0; i < cubes.length; i++) {
        if (cubes[i].UUID == inputUUID) {
            return cubes[i]
        }
    }
}

function promptTexture() {
    var promptOptions = { title: "Adding a TC compliant texture", message: "Simply create a texture (blank or with the appropriate png) named 'minecraft:blockname'. For example, if you wanted to create a cherry planks texture, you might create a blank pink texture with name 'minecraft:cherry_planks'. If you do import official Minecraft textures, note that the BOTTOM face of every material still needs to be named the actual block's ID. For example, 'minecraft:cherry_planks_down' wouldn't be parsed correctly in this version, but 'minecraft:cherry_planks' would" }
    Blockbench.showMessageBox(promptOptions)



}
