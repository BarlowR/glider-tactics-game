import * as THREE from 'three';



function flatten_to_triangle_mesh(height_map, color_map) {
    var triangle_mesh = [];
    var colors = [];
    for (const [x_index, row] of height_map.entries()) {
        if (x_index == height_map.length - 1) { continue; }
        for (const [y_index, height] of row.entries()) {
            if (y_index == row.length - 1) { continue; }

            const bottom_left_elevation = height;
            const bottom_right_elevation = height_map[x_index + 1][y_index];
            const top_left_elevation = height_map[x_index][y_index + 1];
            const top_right_elevation = height_map[x_index + 1][y_index + 1];

            // determine which orientation of triangles to use.
            const diagonal_1 = bottom_left_elevation + top_right_elevation;
            const diagonal_2 = bottom_right_elevation + top_left_elevation;
            const use_diagonal_1 = diagonal_1 < diagonal_2;

            // Bottom left corner of 1st triangle
            triangle_mesh.push(x_index, y_index, bottom_left_elevation);
            colors.push(...color_map[x_index][y_index]);

            // Bottom right corner of 1st triangle
            triangle_mesh.push(x_index + 1, y_index, bottom_right_elevation);
            colors.push(...color_map[x_index + 1][y_index]);

            if (use_diagonal_1) {
                // Use top right corner for 1st triangle
                triangle_mesh.push(x_index + 1, y_index + 1, top_right_elevation);
                colors.push(...color_map[x_index + 1][y_index + 1]);

            } else {
                // Use top left corner for 1st triangle
                triangle_mesh.push(x_index, y_index + 1, top_left_elevation);
                colors.push(...color_map[x_index][y_index + 1]);
            }

            // Top right corner of 1st triangle
            triangle_mesh.push(x_index + 1, y_index + 1, top_right_elevation);
            colors.push(...color_map[x_index + 1][y_index + 1]);

            // Top left corner of 1st triangle
            triangle_mesh.push(x_index, y_index + 1, top_left_elevation);
            colors.push(...color_map[x_index][y_index + 1]);

            if (use_diagonal_1) {
                // Use bottom left corner for 1st triangle
                triangle_mesh.push(x_index, y_index, bottom_left_elevation);
                colors.push(...color_map[x_index][y_index]);
            } else {
                // Use bottom right corner for 1st triangle
                triangle_mesh.push(x_index + 1, y_index, bottom_right_elevation);
                colors.push(...color_map[x_index + 1][y_index]);
            }
        }
    }
    return [new Float32Array(triangle_mesh), new Float32Array(colors)];
}

function height_map_to_color_map(height_map) {
    var color_map = [];
    for (const [x_index, row] of height_map.entries()) {
        var row_colors = []
        for (const [y_index, height] of row.entries()) {
            if (height < 0.5) {
                row_colors.push([0.039, 0.471, 0.09]);
            } else if (height < 1.0) {
                row_colors.push([0.278, 0.702, 0.329]);
            } else if (height < 1.60) {
                row_colors.push([0.749, 0.671, 0.478]);
            } else {
                row_colors.push([1, 1, 1]);
            }
        }
        color_map.push(row_colors);
    }
    return color_map
}

function create_terrain_mesh(height_map, height_scaling_factor, color_map = false) {
    const geometry = new THREE.BufferGeometry();
    if (!color_map) {
        color_map = height_map_to_color_map(height_map);
    }
    const [mesh_triangles, colors] = flatten_to_triangle_mesh(height_map, color_map);

    // itemSize = 3 because there are 3 values (components) per vertex
    geometry.setAttribute('position', new THREE.BufferAttribute(mesh_triangles, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    // geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetUnits: -0.1 });
    const line = new THREE.LineBasicMaterial({ color: 0xffffff });
    var mesh = new THREE.Mesh(geometry, material);

    mesh.scale.set(1, 1, height_scaling_factor)

    // Wireframe rendering
    var wireframe = new THREE.LineSegments(geometry, line);
    // mesh.add(wireframe);
    return mesh;
}

export { create_terrain_mesh, height_map_to_color_map };
