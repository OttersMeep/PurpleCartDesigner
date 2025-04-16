let button;
let addTextureTC;
let textureForm;
let getTextureName;

function selectedCubeTextureName() {
    return getTextureNameFromUUID(Cube.selected[0].faces.down.texture);
}
function getTextureNameFromUUID(inputUUID) {
    for (let i = 0; i < Texture.all.length; i++) { 
        if (Texture.all[i].uuid == inputUUID) {
            return Texture.all[i].name.replace(/\.[^/.]+$/, "")
         }
    }
}
  
function paste(data) {
    options = {title: "Copied TrainCarts Data to your clipboard", message: `Upload to a paste site such as https://paste.traincarts.net and download for use in TrainCarts. \n \n Make sure all pivot points are in the CENTER of your cuboids \n \n This Blockbench plugin was made by @OttersMeep on Discord for PurpleTrain, and TrainCarts by BergerHealer.`}
    navigator.clipboard.writeText(data)
    Blockbench.showMessageBox(options)
}


function addTexture(text) {
    data = {name: text}
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
    version: '0.0.1alpha',
    variant: 'both',
    onload() {
        getTextureName = new Action('get_texture_name', {
            name: 'Get texture name',
            description: 'DEBUG',
            icon: 'feature_search',
            click: function() {
                selectedCubeTextureName()
            }
        })
        addTextureTC = new Action('add_texture', { 
            name: 'New TC compliant texture',
            description: 'Add a texture',
            icon: 'texture-add',
            click: function() {
                promptTexture()
            }
        })
        button = new Action('export', {
            name: 'Export to Traincarts',
            description: 'Uploads to the Traincarts pastebin',
            icon: 'save',
            click: function() {
                //Code for clicking button
                var uploadTxt = exportCube(Cube.selected)
                console.log(uploadTxt)
                
            }
        });
        MenuBar.addAction(button, 'filter');
    },
    onunload() {
        button.delete();
    }
});

function exportCube(elements) {
    data =  `type: EMPTY\nattachments:`;
    console.log(data)
    for (let i = 0; i < elements.length; i++) { 
    console.log("Cube #"+i+":")
    console.log(elements[i])
    posX = ((elements[i].from[0]+elements[i].to[0])/2)-0.5
    posY = elements[i].from[1]
    posZ = ((elements[i].from[2]+elements[i].to[2])/2)-0.5
    rotX = elements[i].rotation[0]
    rotY = elements[i].rotation[1]
    rotZ = elements[i].rotation[2]
    sizeX = Math.abs(elements[i].from[0]-elements[i].to[0])
    sizeY = Math.abs(elements[i].from[1]-elements[i].to[1])
    sizeZ = Math.abs(elements[i].from[2]-elements[i].to[2])
    textureName = getTextureNameFromUUID(elements[i].faces.down.texture)
    if (textureName == null) {
        var promptOptions = {title: "Failed to compile to traincarts", message: "Reason: Missing Texture on cube #"+i+" with UUID: "+elements[i].uuid+" and name: \'"+elements[i].name+"'"}
        Blockbench.showMessageBox(promptOptions) 
        console.log("ERROR: Missing Texture on Cube with UUID: "+elements[i].uuid)
        return false
    }
    data = (data + `\n  ${i}:\n    type: BLOCK_DISPLAY\n    firstPersonViewMode: DYNAMIC\n    displayMode: DEFAULT\n    firstPersonViewLockMode: 'OFF'\n    lockRotation: false\n    displayItem:\n      enabled: false\n    position:\n      transform: HYBRID_ARMORSTAND_HEAD\n      posX: ${posX}\n      posY: ${posY}\n      posZ: ${posZ}\n      rotX: ${rotX}\n      rotY: ${rotY}\n      rotX: ${rotX}\n      sizeX: ${sizeX}\n      sizeY: ${sizeY}\n      sizeZ: ${sizeZ}\n    shulkerColor: DEFAULT\n    item:\n      ==: org.bukkit.inventory.ItemStack\n      v: 4189\n      type: PUMPKIN\n    entityType: MINECART\n    blockData: ${textureName}`)
    }
    data = (data + `\neditor:\n  selectedIndex: 0\n  scrollOffset: 0`)
    paste(data)
}

function promptTexture() {
    var promptOptions = {title: "Adding a TC compliant texture", message: "Simply create a texture (blank or with the appropriate png) named 'minecraft:blockname'. For example, if you wanted to create a cherry planks texture, you might create a blank pink texture with name 'minecraft:cherry_planks'. If you do import official Minecraft textures, note that the BOTTOM face of every material still needs to be named the actual block's ID. For example, 'minecraft:cherry_planks_down' wouldn't be parsed correctly in this version, but 'minecraft:cherry_planks' would"}
    Blockbench.showMessageBox(promptOptions)
    
    
    
}
