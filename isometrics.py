def xyz_to_iso_xy(x,y,z):
    """
    Given x,y,z position, projects to an isometric grid and returns 2d (x, y) tuple
    """
    iso_x = (0.5*x - 0.5*y)
    iso_y = (0.25*x + 0.25*y + z)

    return (iso_x, iso_y)


def create_iso_lines(grid_3d):
    """
    grid_3d[x][y] = z

    returns:
    [[(x1, y1), (x2, y2)],
     [(x1, y1), (x2, y2)],
    ]
    for use in matplotlib LineCollection
    """

    lines = []
    x_size = len(grid_3d)
    y_size = len(grid_3d[0])
    for x_index in range(x_size):
        for y_index in range(y_size):
            z = grid_3d[x_index][y_index]

            current_iso_projection = xyz_to_iso_xy(x_index, y_index, z)
            # Create line from current to next along x axis if not at the far edge    
            if (x_index < x_size - 1):
                next_x_z = grid_3d[x_index+1][y_index]
                next_x_iso_projection = xyz_to_iso_xy(x_index+1, y_index, next_x_z)
                lines.append([current_iso_projection, next_x_iso_projection])
            
            if (y_index < y_size - 1):
                next_y_z = grid_3d[x_index][y_index+1]
                next_y_iso_projection = xyz_to_iso_xy(x_index, y_index+1, next_y_z)
                lines.append([current_iso_projection, next_y_iso_projection])

    return lines




    

