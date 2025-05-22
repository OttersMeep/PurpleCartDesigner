//*
//You are using a BETA build of PurpleCart Designer- bugs are expected and features will be missing

//PurpleCart Designer is property of OttersMeep
//Do not share, reupload, distribute, or otherwise disseminate this script without prior permission (contact me @ottersmeep on Discord)

//Created by OttersMeep for PurpleTrain
//minecartrapidtransit.net

//No generative artificial intelligence was used in the making of this code, as I am fully capable of writing broken code all by myself

export const version = "0.2.1hotfix2becauseapparentlyikeepaddingbugs"
let button
let addTextureTC
let textureForm
let getTextureName
import * as YAML from 'yaml'


function verCheck(NwVersion) {
    NewVersion = NwVersion.tag_name
    if (NewVersion !== version) {
        const content = `
        <div style="text-align:center">
            <p> There seems to be a new version of PurpleCart Designer. The newest version is ${NewVersion} but you have ${version} </p><br>
            <p> If you are testing a development version of PurpleCart Designer, ignore this message </p>
        </div>
    `

        // Show a custom HTML dialog
        new Dialog({
            id: 'versionDialog',
            title: 'New Version Available',
            lines: [content],
            width: 800,
            buttons: ['Close']
        }).show()
    }
}

function checkVersion() {
    headers = new Headers()
    headers.append("Content-Type", "text/plain")
    headers.append("User-Agent", "OttersMeep-PurpleCartDesigner")

    requestOptions = {
        method: "GET",
        headers: headers,
        redirect: "follow"
    }

    fetch("https://api.github.com/repos/OttersMeep/PurpleCartDesigner/releases/latest")
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
            return response.json() // call the function here
        })
        .then(data => {
            verCheck(data) // you'll see the real response here
        })
        .catch(error => {
            console.error("Error fetching version:", error)
        })
}

function fixHyphenatedYAMLArray(yamlString) {
    const lines = yamlString.split('\n')
    const newLines = []
    const attachStack = []
    let procNames = false

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trim = line.trimStart()
        const indent = line.length - trim.length

        if (trim.startsWith('attachments:')) {
            newLines.push(line)
            attachStack.push({ indent: indent + 2, index: 0 })
        } else if (attachStack.length) {
            const current = attachStack[attachStack.length - 1]
            if (indent === current.indent && trim.startsWith('- type:')) {
                procNames = false
                newLines.push(`${' '.repeat(indent - 2)}${current.index}:`)
                line.split('\n').forEach(l => newLines.push(`${' '.repeat(indent + 2)}${l.trimStart()}`))
                current.index++
            } else if (indent === current.indent && trim.startsWith('names:')) {
                newLines.push(`${' '.repeat(indent)}names:`)
                procNames = true
            } else if (procNames && indent === current.indent + 2) {
                newLines.push(`${' '.repeat(indent)}- ${trim}`)
            } else if (indent > current.indent) {
                newLines.push(line)
            } else if (indent < current.indent) {
                attachStack.pop()
                procNames = false
                newLines.push(line)
            } else {
                newLines.push(line)
                procNames = false
            }
        } else {
            newLines.push(line)
        }
    }
    return newLines.join('\n')
}

function exportProject() {
    let structure = getModelStructure()
    let output = {
        type: "EMPTY",
        entityType: "MINECART",
        attachments: {} // Initialize as object
    }

    walkStructure(structure, output.attachments)

    // Add final metadata
    output.editor = {
        selectedIndex: 0
    }
    output.position = {}
    output.names = Array.isArray(output.names) ? output.names : (output.names ? [output.names] : []) // Ensure top-level names is an array
    const regex = /"(\d+)":/g
    let data = YAML.stringify(output).replace(regex, "$1:")
    post(data)
}

function roundTo(n, digits) {
    if (digits === undefined) {
        digits = 0
    }

    var multiplicator = Math.pow(10, digits)
    n = parseFloat((n * multiplicator).toFixed(11))
    return Math.round(n) / multiplicator
}

function translate(pos, origin, rotation) {
    // pos: [x, y, z] - the position to transform
    // origin: [x, y, z] - the pivot/origin point
    // rotation: [x, y, z] - rotation in degrees

    // Convert arrays to THREE.Vector3
    var position = new THREE.Vector3(pos[0], pos[1], pos[2])
    var pivot = new THREE.Vector3(origin[0], origin[1], origin[2])
    var rotationDeg = new THREE.Euler(
        THREE.MathUtils.degToRad(rotation[0]),
        THREE.MathUtils.degToRad(rotation[1]),
        THREE.MathUtils.degToRad(rotation[2])
    )

    // Step 1: Offset from pivot to position
    var offset = new THREE.Vector3().subVectors(position, pivot)

    // Step 2: Apply rotation to offset
    var rotationQuat = new THREE.Quaternion().setFromEuler(rotationDeg)
    var rotatedOffset = offset.clone().applyQuaternion(rotationQuat)

    // Step 3: Compute adjusted position
    var adjustedPosition = new THREE.Vector3().addVectors(pivot, rotatedOffset)

    return adjustedPosition;
}

function walkStructure(children, outObject) {
    children.forEach((child, index) => {
        if (child.type == "group") {
            console.log(child)
            const groupRotation = child.rotation || [0, 0, 0]
            const groupAttachment = {
                type: "EMPTY",
                // Optionally add an item here if you want, as in your sample
                position: {
                    transform: "DISPLAY_HEAD",
                    posX: 0,
                    posY: 0,
                    posZ: 0,
                    rotX: groupRotation[0],
                    rotY: groupRotation[1],
                    rotZ: groupRotation[2],
                },
                entityType: "MINECART",
                names: Array.isArray(child.name) ? child.name : [child.name],
                attachments: {}
            }

            // Recurse into the group’s children, passing the nested attachments object
            walkStructure(child.children, groupAttachment.attachments)

            // Assign the group attachment to the output object with the current index
            outObject[index] = groupAttachment
        } else if (child.type == "cube") {
            const cube = findCubeByUUID(child.uuid)
            const textureName = getTextureNameFromUUID(cube.faces.down.texture)
            const newCube = convertCube(cube)

            const itemAttachment = {
                type: "ITEM",
                item: {
                    "==": "org.bukkit.inventory.ItemStack",
                    v: 4189,
                    type: textureName
                },
                position: {
                    transform: "DISPLAY_HEAD",
                    posX: newCube.PosX,
                    posY: newCube.PosY,
                    posZ: newCube.PosZ,
                    rotX: newCube.RotX,
                    rotY: newCube.RotY,
                    rotZ: newCube.RotZ,
                    sizeX: newCube.sizeX,
                    sizeY: newCube.sizeY,
                    sizeZ: newCube.sizeZ
                },
                names: Array.isArray(child.name) ? child.name : [child.name] // Ensure names is always an array
            }

            // Assign the item attachment to the output object with the current index
            outObject[index] = itemAttachment
        }
    })
}

function getModelStructure() {
    function processGroup(group) {
        return {
            type: "group",
            name: group.name,
            uuid: group.uuid,
            origin: group.origin,
            rotation: group.rotation,
            children: group.children.map(child => {
                if (child instanceof Group) {
                    return processGroup(child)
                } else if (child instanceof Cube) {
                    return {
                        type: "cube",
                        name: child.name,
                        uuid: child.uuid
                    }
                } else {
                    return null
                }
            }).filter(Boolean)
        }
    }

    var result = Outliner.root.map(rootItem => {
        if (rootItem instanceof Group) {
            return processGroup(rootItem)
        } else if (rootItem instanceof Cube) {
            return {
                type: "cube",
                name: rootItem.name,
                uuid: rootItem.uuid
            }
        } else {
            return null
        }
    }).filter(Boolean)
    return result
}

function getTextureNameFromUUID(inputUUID) {
    for (i = 0; i < Texture.all.length; i++) {
        if (Texture.all[i].uuid == inputUUID) {
            textureName = Texture.all[i].name.replace(/\.[^/.]+$/, "")
        }
    }
    textureName = textureName.replace(/^[^:]*:/, "").toUpperCase()
    return textureName

}

function convertAnimations() {
    animations = getAnimations()
    fixed_animations = []
    for (i = 0; i < animations.length; i++) {
        convertAnimation(animations[i])
    }
}

function convertAnimation(animation) {
    // Identify the type. This could theoretically be streamlined but I don't feel like it bc it would make the code harder to read for me :3
    var type = {
        position: false,
        scale: false,
        rotation: false
    }
    if (animation.position.length > 0) {
        type.position = true
    }
    if (animation.scale.length > 0) {
        type.scale = true
    }
    if (animation.rotation.length > 0) {
        type.rotation = true
    }

    var frames = {
    }
    perTransformKeyframes = {}
    frames.name = animation.animation.name
    // Now let's actually do the thing this function is going to do
    for (m = 0; m < 3; m++) {
        var k = [animation.position, animation.scale, animation.rotation][m]
        perTransformKeyframes[m] = []
        for (j = 0; j < k.length; j++) {
            perTransformKeyframes[m].push(k[j].time)
        }
        if ([type.position, type.scale, type.rotation][m]) {
            for (i = 0; i < k.length; i++) {
                if (!Object.keys(frames).includes(k[i].time)) {
                    console.log(k[i].time)
                    console.log(Object.keys(frames))
                    frames[k[i].time] = {}
                }
                if (perTransformKeyframes[m].includes(k[i].time)) {
                    data = k[i].data_points[0]
                    values = [data.x, data.y, data.z]
                    if (m == 0) {
                        // Position
                        frames[k[i].time].pos = values
                    }
                    if (m == 1) {
                        // Scale
                        frames[k[i].time].scale = values
                    }
                    if (m == 2) {
                        // Rotation
                        frames[k[i].time].rot = values
                    }
                }
            }
        }
    }
    console.log(frames)
    /*    if (type.position) {
            transformations.position = []
            for (i=0;i<animation.position.length;i++) {
                var keyframe = animation.position[i]
                transformations.position[i] = {}
                transformations.position[i].x = keyframe.data_points[0].x
                transformations.position[i].y = keyframe.data_points[0].y
                transformations.position[i].z = keyframe.data_points[0].z
                transformations.position[i].time = keyframe.time
                if (!keyframes.includes(keyframe.time)) {
                    keyframes.push(keyframe.time)
                }
            }
        }
        keyframes.sort()
        console.log(transformations)*/

}


function getAnimations() {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    var animators = Blockbench.ModelProject.all[0].animations[0].animators
    var animations = []
    targetObject = animators
    uuidEntries = Object.entries(targetObject).filter(([key, value]) => uuidRegex.test(key))
    uuidObjects = Object.fromEntries(uuidEntries)
    for (i = 0; i < uuidEntries.length; i++) {
        if (uuidEntries[i][1].position.length > 0 || uuidEntries[i][1].rotation.length > 0 || uuidEntries[i][1].scale.length > 0) {
            animations.push(uuidEntries[i][1])
        }
    }
    console.log("Logging animations now!")
    console.log(animations)
    return animations
}

function post(data) {
    Blockbench.showQuickMessage("Uploading to the TrainCarts pastebin- this behavior can be toggled off in settings")
    headers = new Headers()
    headers.append("Content-Type", "text/plain")

    requestOptions = {
        method: "POST",
        headers: headers,
        body: data,
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
            The TrainCarts plugin is developed by BergerHealer completely independently of this project.</p>
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

function debug() {
    console.log(getPos(0))
    /*
    console.log(getModelStructure())
    convertAnimations()
    */
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
        checkVersion()
        getTextureName = new Action('PRINT_PROJECT', {
            name: 'DEBUG',
            description: 'DEBUG',
            icon: 'feature_search',
            click: function () {
                debug()
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

You are running version ${version}

No generative artificial intelligence or machine learning models were used in the making of this code, as I am fully capable of writing broken code all by myself`)
    },
    onunload() {
        button.delete()
    }
})

function convertCube(cube) {
    PosOriginal = [(cube.from[0] + cube.to[0]) / 2, (cube.from[1] + cube.to[1]) / 2, (cube.from[2] + cube.to[2]) / 2]
    Rot = cube.rotation
    Pos = translate(PosOriginal, cube.origin, cube.rotation)
    var newCube = {
        PosX: Pos.x,
        PosY: Pos.y,
        PosZ: Pos.z,
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
    for (i = 0; i < Blockbench.Cube.all.length; i++) {
        if (Blockbench.Cube.all[i].uuid == inputUUID) {
            return Blockbench.Cube.all[i]
        }
    }
}

function promptTexture() {
    var promptOptions = { title: "Adding a TC compliant texture", message: "Simply create a texture (blank or with the appropriate png) named 'minecraft:blockname'. For example, if you wanted to create a cherry planks texture, you might create a blank pink texture with name 'minecraft:cherry_planks'. If you do import official Minecraft textures, note that the BOTTOM face of every material still needs to be named the actual block's ID. For example, 'minecraft:cherry_planks_down' wouldn't be parsed correctly in this version, but 'minecraft:cherry_planks' would" }
    Blockbench.showMessageBox(promptOptions)



}

