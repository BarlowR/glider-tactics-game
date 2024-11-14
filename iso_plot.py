def plot_iso():
    iso_lines = create_iso_lines(map_layer)
    plane = [int(DIM_X/3), int(4*DIM_Y/5), 3]
    plane_ground = xyz_to_iso_xy(plane[0], plane[1], map_layer[plane[0]][plane[1]])
    plane_air = xyz_to_iso_xy(plane[0], plane[1], plane[2])
    lc = LineCollection(iso_lines, zorder=0)
    # Create a figure and axes
    fig, ax = plt.subplots(figsize=(32,20))

    x = []
    y = []
    heat = []
    for thermal_loc, thermal_energy in thermals.thermals.items():
        loc = xyz_to_iso_xy(thermal_loc[0], thermal_loc[1], map_layer[thermal_loc[0]][thermal_loc[1]])
        x.append(loc[0])
        y.append(loc[1])
        heat.append(thermal_energy)
        
    ax.scatter(x, y, s=heat, c="r")
        
    # Add the LineCollection to the axes
    ax.add_collection(lc)
    ax.set_xlim(-DIM_X/2, DIM_X/2)
    ax.set_ylim(0, DIM_Y/2)
