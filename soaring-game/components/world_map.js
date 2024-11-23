const unit = 400;
const aspect_ratio = 1.2;
const min_zoom = 20
const max_zoom = 200

class WorldMap {
    constructor(dom_parent,
        window_width,
        window_height,
        starting_position,
        color_map,
        settings,
        base_color = "#000000",
        highlight_color = "#e1d9d9",
        dial_color = "#ffffff",
        panel_color = "#6e6e6e", 
        instrument_panel_scaling = 0.5, 
        padding = 20) {
        var map_canvas = document.createElement("canvas");
        map_canvas.id = "world_map";
        dom_parent.appendChild(map_canvas);
        
        map_canvas.width = aspect_ratio * unit;
        map_canvas.height = unit;
        map_canvas.style.width = map_canvas.width * instrument_panel_scaling + "px";
        map_canvas.style.height = map_canvas.height * instrument_panel_scaling + "px";
        map_canvas.style.position = "absolute";
        
        map_canvas.style.left = (window_width - (3* padding + (map_canvas.width * instrument_panel_scaling))) + "px";
        map_canvas.style.top = (window_height - (2* padding + (map_canvas.height * instrument_panel_scaling))) + "px";
        this.color_map = color_map;
        this.image_buffer;
        
        this.settings = settings;
        this.zoom_level = this.settings.initial_zoom_level
        
        this.map_width = color_map.length
        this.map_height = color_map[0].length
        
        this.base_color = base_color;
        this.highlight_color = highlight_color;
        this.dial_color = dial_color;
        this.panel_color = panel_color;
        
        this.map_canvas_context = map_canvas.getContext("2d");
        this.map_canvas_context.scale(1, -1);
        this.map_canvas_context.translate(0, -unit);
        this.map_canvas_context.imageSmoothingEnabled = false;

                
        this.color_map_to_buffer()
        this.update_world_map(starting_position, this.color_map);
    }

    color_map_to_buffer = () => {
        this.image_buffer = new Uint8ClampedArray(this.map_width * this.map_height * 4); // have enough bytes

        for(var x = 0; x < this.map_width; x++) {
            for(var y = 0; y < this.map_height; y++) {
                var pos = (y * this.map_width + x) * 4; // position in buffer based on x and y
                this.image_buffer[pos  ] = Math.floor(this.color_map[x][y][0] * 255);
                this.image_buffer[pos+1] = Math.floor(this.color_map[x][y][1] * 255);
                this.image_buffer[pos+2] = Math.floor(this.color_map[x][y][2] * 255);
                this.image_buffer[pos+3] = 255; // set alpha channel
            }
        }
    }

    fill_background = () => {
        this.map_canvas_context.fillStyle = this.base_color
        this.map_canvas_context.beginPath();
        this.map_canvas_context.rect(0, 0, unit*aspect_ratio, -unit)
        this.map_canvas_context.fill();
    }

    place_image = (position) => {
        // create imageData object
        var map_image = this.map_canvas_context.createImageData(this.map_width, this.map_height);

        // set our buffer as source
        map_image.data.set(this.image_buffer);

        // compute the bounds of the map
        const map_width = Math.floor(this.zoom_level * aspect_ratio);
        const map_height = Math.floor(this.zoom_level);
        const map_x_offset = position.x + 0.5 - map_width/2
        const map_y_offset = position.y + 0.5 - map_height/2
        createImageBitmap(map_image)
            .then((bitmap_image)=>{
                this.map_canvas_context.drawImage(bitmap_image, 
                    map_x_offset, map_y_offset, map_width, map_height,
                    0, 0, unit * aspect_ratio, unit);
                this.draw_glider_icon();
        })
    }
    update_world_map = (position, latest_event)  => {
        if ((latest_event == ["-"] || latest_event == ["_"]) && (this.zoom_level < max_zoom)) {
            this.zoom_level += 1
        } else if ((latest_event == ["="] || latest_event == ["+"]) && (this.zoom_level > min_zoom)) {
            this.zoom_level -= 1
        } 
        this.fill_background()
        this.place_image(position)
    }

    draw_glider_icon(){
        this.map_canvas_context.fillStyle = this.settings.glider_color
        this.map_canvas_context.beginPath();
        this.map_canvas_context.arc(aspect_ratio * unit/2, unit/2, 10, 0, 2*Math.PI);
        this.map_canvas_context.fill();
    }
}
export { WorldMap }
